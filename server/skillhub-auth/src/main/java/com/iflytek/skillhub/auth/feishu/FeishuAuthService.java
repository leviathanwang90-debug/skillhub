package com.iflytek.skillhub.auth.feishu;

import com.iflytek.skillhub.auth.entity.Role;
import com.iflytek.skillhub.auth.entity.UserRoleBinding;
import com.iflytek.skillhub.auth.identity.IdentityBindingService;
import com.iflytek.skillhub.auth.oauth.OAuthClaims;
import com.iflytek.skillhub.auth.rbac.PlatformPrincipal;
import com.iflytek.skillhub.auth.repository.RoleRepository;
import com.iflytek.skillhub.auth.repository.UserRoleBindingRepository;
import com.iflytek.skillhub.domain.user.UserStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

/**
 * Orchestrates the Feishu H5 silent-login flow: exchanges a temporary code for
 * user identity, binds or creates a platform user, and optionally grants initial
 * admin privileges.
 */
@Service
public class FeishuAuthService {

    private static final Logger log = LoggerFactory.getLogger(FeishuAuthService.class);
    private static final String PROVIDER_CODE = "feishu";

    private final FeishuApiClient feishuApiClient;
    private final IdentityBindingService identityBindingService;
    private final UserRoleBindingRepository userRoleBindingRepository;
    private final RoleRepository roleRepository;

    public FeishuAuthService(FeishuApiClient feishuApiClient,
                             IdentityBindingService identityBindingService,
                             UserRoleBindingRepository userRoleBindingRepository,
                             RoleRepository roleRepository) {
        this.feishuApiClient = feishuApiClient;
        this.identityBindingService = identityBindingService;
        this.userRoleBindingRepository = userRoleBindingRepository;
        this.roleRepository = roleRepository;
    }

    /**
     * Authenticates a user via Feishu authorization code.
     *
     * @param appId               Feishu App ID
     * @param appSecret           Feishu App Secret
     * @param code                temporary authorization code from JSSDK
     * @param initialAdminOpenIds list of open_ids that should receive SUPER_ADMIN on first login
     * @return authenticated platform principal
     */
    @Transactional
    public PlatformPrincipal authenticateByCode(String appId,
                                                 String appSecret,
                                                 String code,
                                                 List<String> initialAdminOpenIds) {
        // Step 1: Get app_access_token
        String appAccessToken = feishuApiClient.getAppAccessToken(appId, appSecret);

        // Step 2: Exchange code for user_access_token
        FeishuApiClient.UserAccessTokenResponse tokenResp =
                feishuApiClient.getUserAccessToken(appAccessToken, code);

        // Step 3: Get user info
        FeishuApiClient.FeishuUserInfo userInfo = feishuApiClient.getUserInfo(tokenResp.accessToken);

        log.info("Feishu login: name={}, open_id={}", userInfo.name, userInfo.openId);

        // Step 4: Build OAuthClaims
        Map<String, Object> extra = new HashMap<>();
        extra.put("avatar_url", userInfo.avatarUrl != null ? userInfo.avatarUrl : userInfo.avatarMiddle);
        extra.put("open_id", userInfo.openId);
        extra.put("union_id", userInfo.unionId);
        extra.put("tenant_key", userInfo.tenantKey);

        String displayName = userInfo.name != null ? userInfo.name : userInfo.enName;
        String email = userInfo.enterpriseEmail != null ? userInfo.enterpriseEmail : userInfo.email;

        OAuthClaims claims = new OAuthClaims(
                PROVIDER_CODE,
                userInfo.openId,       // subject = open_id (unique per app)
                email,
                email != null,
                displayName,
                extra
        );

        // Step 5: Bind or create user (auto-activate)
        PlatformPrincipal principal = identityBindingService.bindOrCreate(claims, UserStatus.ACTIVE);

        // Step 6: Grant SUPER_ADMIN to initial admin open_ids (first-time only)
        if (initialAdminOpenIds != null && initialAdminOpenIds.contains(userInfo.openId)) {
            boolean alreadyAdmin = principal.platformRoles().contains("SUPER_ADMIN");
            if (!alreadyAdmin) {
                log.info("Granting SUPER_ADMIN to initial admin: userId={}, openId={}",
                        principal.userId(), userInfo.openId);
                Role superAdminRole = roleRepository.findByCode("SUPER_ADMIN")
                        .orElseThrow(() -> new IllegalStateException("SUPER_ADMIN role not found in database"));
                boolean hasBinding = userRoleBindingRepository.findByUserId(principal.userId()).stream()
                        .anyMatch(rb -> "SUPER_ADMIN".equals(rb.getRole().getCode()));
                if (!hasBinding) {
                    userRoleBindingRepository.save(new UserRoleBinding(principal.userId(), superAdminRole));
                }
                // Rebuild principal with updated roles
                var updatedRoles = new HashSet<>(principal.platformRoles());
                updatedRoles.add("SUPER_ADMIN");
                principal = new PlatformPrincipal(
                        principal.userId(),
                        principal.displayName(),
                        principal.email(),
                        principal.avatarUrl(),
                        principal.oauthProvider(),
                        updatedRoles
                );
            }
        }

        return principal;
    }
}
