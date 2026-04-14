package com.iflytek.skillhub.controller;

import com.iflytek.skillhub.auth.feishu.FeishuAuthException;
import com.iflytek.skillhub.auth.feishu.FeishuAuthService;
import com.iflytek.skillhub.auth.rbac.PlatformPrincipal;
import com.iflytek.skillhub.auth.session.PlatformSessionService;
import com.iflytek.skillhub.config.FeishuAuthProperties;
import com.iflytek.skillhub.dto.ApiResponse;
import com.iflytek.skillhub.dto.ApiResponseFactory;
import com.iflytek.skillhub.dto.AuthMeResponse;
import com.iflytek.skillhub.ratelimit.RateLimit;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * REST controller that handles Feishu H5 silent-login requests.
 *
 * <p>The frontend obtains a temporary authorization code via the Feishu JSSDK
 * ({@code tt.requestAuthCode}) and posts it here. This controller exchanges the
 * code for user identity, creates or binds a platform user, establishes a
 * session, and returns the authenticated user profile.
 */
@RestController
@RequestMapping("/api/v1/auth/feishu")
@ConditionalOnProperty(name = "skillhub.feishu.enabled", havingValue = "true")
public class FeishuAuthController extends BaseApiController {

    private static final Logger log = LoggerFactory.getLogger(FeishuAuthController.class);

    private final FeishuAuthService feishuAuthService;
    private final FeishuAuthProperties feishuAuthProperties;
    private final PlatformSessionService platformSessionService;

    public FeishuAuthController(FeishuAuthService feishuAuthService,
                                FeishuAuthProperties feishuAuthProperties,
                                PlatformSessionService platformSessionService,
                                ApiResponseFactory responseFactory) {
        super(responseFactory);
        this.feishuAuthService = feishuAuthService;
        this.feishuAuthProperties = feishuAuthProperties;
        this.platformSessionService = platformSessionService;
    }

    /**
     * Exchanges a Feishu authorization code for a platform session.
     */
    @PostMapping("/login")
    @RateLimit(category = "auth-feishu-login", authenticated = 30, anonymous = 15, windowSeconds = 60)
    public ApiResponse<AuthMeResponse> feishuLogin(@Valid @RequestBody FeishuLoginRequest request,
                                                    HttpServletRequest httpRequest) {
        try {
            PlatformPrincipal principal = feishuAuthService.authenticateByCode(
                    feishuAuthProperties.getAppId(),
                    feishuAuthProperties.getAppSecret(),
                    request.code(),
                    feishuAuthProperties.getInitialAdminOpenIds()
            );
            platformSessionService.establishSession(principal, httpRequest);
            return ok("response.success.read", AuthMeResponse.from(principal));
        } catch (FeishuAuthException e) {
            log.error("Feishu login failed: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Feishu authentication failed: " + e.getMessage());
        }
    }

    /**
     * Returns the Feishu App ID for the frontend JSSDK initialization.
     */
    @GetMapping("/config")
    public ApiResponse<FeishuConfigResponse> getFeishuConfig() {
        return ok("response.success.read", new FeishuConfigResponse(feishuAuthProperties.getAppId()));
    }

    public record FeishuLoginRequest(@NotBlank String code) {}

    public record FeishuConfigResponse(String appId) {}
}
