package com.iflytek.skillhub.auth.feishu;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

/**
 * Low-level HTTP client for Feishu Open Platform APIs.
 *
 * <p>Handles app_access_token acquisition and user identity resolution
 * from a temporary authorization code obtained via the Feishu JSSDK.
 */
@Component
public class FeishuApiClient {

    private static final Logger log = LoggerFactory.getLogger(FeishuApiClient.class);

    private static final String APP_ACCESS_TOKEN_URL =
            "https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal";
    private static final String USER_ACCESS_TOKEN_URL =
            "https://open.feishu.cn/open-apis/authen/v1/oidc/access_token";
    private static final String USER_INFO_URL =
            "https://open.feishu.cn/open-apis/authen/v1/user_info";

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public FeishuApiClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /**
     * Obtains an app_access_token using internal app credentials.
     */
    public String getAppAccessToken(String appId, String appSecret) {
        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "app_id", appId,
                    "app_secret", appSecret
            ));
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(APP_ACCESS_TOKEN_URL))
                    .header("Content-Type", "application/json; charset=utf-8")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .timeout(Duration.ofSeconds(10))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            AppAccessTokenResponse tokenResp = objectMapper.readValue(response.body(), AppAccessTokenResponse.class);
            if (tokenResp.code != 0) {
                log.error("Failed to get app_access_token: code={}, msg={}", tokenResp.code, tokenResp.msg);
                throw new FeishuAuthException("Failed to get app_access_token: " + tokenResp.msg);
            }
            return tokenResp.appAccessToken;
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new FeishuAuthException("Failed to call Feishu app_access_token API", e);
        }
    }

    /**
     * Exchanges a temporary authorization code for a user_access_token.
     */
    public UserAccessTokenResponse getUserAccessToken(String appAccessToken, String code) {
        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "grant_type", "authorization_code",
                    "code", code
            ));
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(USER_ACCESS_TOKEN_URL))
                    .header("Content-Type", "application/json; charset=utf-8")
                    .header("Authorization", "Bearer " + appAccessToken)
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .timeout(Duration.ofSeconds(10))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            FeishuApiResponse<UserAccessTokenResponse> resp = objectMapper.readValue(
                    response.body(),
                    objectMapper.getTypeFactory().constructParametricType(
                            FeishuApiResponse.class, UserAccessTokenResponse.class));
            if (resp.code != 0) {
                log.error("Failed to get user_access_token: code={}, msg={}", resp.code, resp.msg);
                throw new FeishuAuthException("Failed to get user_access_token: " + resp.msg);
            }
            return resp.data;
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new FeishuAuthException("Failed to call Feishu user_access_token API", e);
        }
    }

    /**
     * Retrieves user info using a valid user_access_token.
     */
    public FeishuUserInfo getUserInfo(String userAccessToken) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(USER_INFO_URL))
                    .header("Authorization", "Bearer " + userAccessToken)
                    .GET()
                    .timeout(Duration.ofSeconds(10))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            FeishuApiResponse<FeishuUserInfo> resp = objectMapper.readValue(
                    response.body(),
                    objectMapper.getTypeFactory().constructParametricType(
                            FeishuApiResponse.class, FeishuUserInfo.class));
            if (resp.code != 0) {
                log.error("Failed to get user_info: code={}, msg={}", resp.code, resp.msg);
                throw new FeishuAuthException("Failed to get user info: " + resp.msg);
            }
            return resp.data;
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new FeishuAuthException("Failed to call Feishu user_info API", e);
        }
    }

    // ---- Response DTOs ----

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class FeishuApiResponse<T> {
        public int code;
        public String msg;
        public T data;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AppAccessTokenResponse {
        public int code;
        public String msg;
        @JsonProperty("app_access_token")
        public String appAccessToken;
        public int expire;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class UserAccessTokenResponse {
        @JsonProperty("access_token")
        public String accessToken;
        @JsonProperty("token_type")
        public String tokenType;
        @JsonProperty("expires_in")
        public int expiresIn;
        @JsonProperty("refresh_token")
        public String refreshToken;
        @JsonProperty("open_id")
        public String openId;
        @JsonProperty("union_id")
        public String unionId;
        @JsonProperty("tenant_key")
        public String tenantKey;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class FeishuUserInfo {
        public String name;
        @JsonProperty("en_name")
        public String enName;
        @JsonProperty("avatar_url")
        public String avatarUrl;
        @JsonProperty("avatar_thumb")
        public String avatarThumb;
        @JsonProperty("avatar_middle")
        public String avatarMiddle;
        @JsonProperty("avatar_big")
        public String avatarBig;
        @JsonProperty("open_id")
        public String openId;
        @JsonProperty("union_id")
        public String unionId;
        public String email;
        @JsonProperty("enterprise_email")
        public String enterpriseEmail;
        @JsonProperty("user_id")
        public String userId;
        @JsonProperty("mobile")
        public String mobile;
        @JsonProperty("tenant_key")
        public String tenantKey;
    }
}
