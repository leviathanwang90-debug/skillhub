package com.iflytek.skillhub.listener;

import com.iflytek.skillhub.domain.audit.AuditLogService;
import com.iflytek.skillhub.domain.event.SkillDownloadedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Listens for {@link SkillDownloadedEvent} and writes an audit log entry
 * so that administrators can track who downloaded which skill version.
 *
 * <p>The listener runs asynchronously to avoid blocking the download response.
 */
@Component
public class SkillDownloadAuditListener {

    private static final Logger log = LoggerFactory.getLogger(SkillDownloadAuditListener.class);

    private final AuditLogService auditLogService;

    public SkillDownloadAuditListener(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @Async
    @TransactionalEventListener
    public void onSkillDownloaded(SkillDownloadedEvent event) {
        try {
            String userId = MDC.get("userId");
            String requestId = MDC.get("requestId");
            String clientIp = MDC.get("clientIp");
            String userAgent = MDC.get("userAgent");

            String detailJson = String.format(
                    "{\"skillId\":%d,\"versionId\":%d}",
                    event.skillId(), event.versionId());

            auditLogService.record(
                    userId,
                    "SKILL_DOWNLOAD",
                    "SKILL_VERSION",
                    event.versionId(),
                    requestId,
                    clientIp,
                    userAgent,
                    detailJson
            );

            log.debug("Audit log recorded for skill download: skillId={}, versionId={}, userId={}",
                    event.skillId(), event.versionId(), userId);
        } catch (Exception e) {
            log.warn("Failed to record download audit log for skillId={}, versionId={}: {}",
                    event.skillId(), event.versionId(), e.getMessage());
        }
    }
}
