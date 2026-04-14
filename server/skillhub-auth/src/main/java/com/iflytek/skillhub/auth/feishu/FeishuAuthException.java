package com.iflytek.skillhub.auth.feishu;

/**
 * Thrown when Feishu authentication or API interaction fails.
 */
public class FeishuAuthException extends RuntimeException {

    public FeishuAuthException(String message) {
        super(message);
    }

    public FeishuAuthException(String message, Throwable cause) {
        super(message, cause);
    }
}
