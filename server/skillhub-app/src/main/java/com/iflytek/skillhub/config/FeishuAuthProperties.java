package com.iflytek.skillhub.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Configuration properties for Feishu (Lark) H5 silent-login integration.
 *
 * <p>Binds to the {@code skillhub.feishu} prefix in {@code application.yml}.
 */
@Component
@ConfigurationProperties(prefix = "skillhub.feishu")
public class FeishuAuthProperties {

    private boolean enabled = false;
    private String appId;
    private String appSecret;

    /**
     * Comma-separated list of Feishu open_ids that will be granted SUPER_ADMIN
     * on first login. Used to bootstrap the initial administrator.
     */
    private List<String> initialAdminOpenIds = List.of();

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public String getAppId() { return appId; }
    public void setAppId(String appId) { this.appId = appId; }

    public String getAppSecret() { return appSecret; }
    public void setAppSecret(String appSecret) { this.appSecret = appSecret; }

    public List<String> getInitialAdminOpenIds() { return initialAdminOpenIds; }
    public void setInitialAdminOpenIds(List<String> initialAdminOpenIds) {
        this.initialAdminOpenIds = initialAdminOpenIds;
    }
}
