import { useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { useFeishuLogin, isFeishuClient } from '@/features/auth/use-feishu-login'
import { Button } from '@/shared/ui/button'

/**
 * Authentication entry page — Feishu-only silent login.
 *
 * When opened inside the Feishu client, it automatically triggers the H5
 * silent-login flow via the JSSDK. No password form or registration link is
 * shown.
 */
export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const search = useSearch({ from: '/login' })
  const returnTo = search.returnTo && search.returnTo.startsWith('/') ? search.returnTo : '/dashboard'

  const { user, error, loading, trigger } = useFeishuLogin()

  // Navigate to the target page once login succeeds
  useEffect(() => {
    if (user) {
      navigate({ to: returnTo })
    }
  }, [user, navigate, returnTo])

  const inFeishu = isFeishuClient()

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md space-y-8 animate-fade-up">
        <div className="text-center space-y-3">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 items-center justify-center shadow-glow mb-4">
            <span className="text-primary-foreground font-bold text-2xl">S</span>
          </div>
          <h1 className="text-4xl font-bold font-heading text-foreground">SkillHub</h1>
          <p className="text-muted-foreground text-lg">
            {inFeishu
              ? t('login.feishuAutoLogin', '正在通过飞书登录...')
              : t('login.feishuRequired', '请在飞书客户端中打开')}
          </p>
        </div>

        <div className="glass-strong p-8 rounded-2xl">
          <div className="space-y-6">
            {loading ? (
              <div className="flex flex-col items-center space-y-4 py-8">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  {t('login.feishuLoggingIn', '正在验证飞书身份...')}
                </p>
              </div>
            ) : error ? (
              <div className="space-y-4 py-4">
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                  {error}
                </div>
                {inFeishu ? (
                  <Button onClick={trigger} className="w-full">
                    {t('login.feishuRetry', '重试')}
                  </Button>
                ) : (
                  <p className="text-center text-sm text-muted-foreground">
                    {t('login.feishuOpenHint', '请在飞书工作台中打开此应用')}
                  </p>
                )}
              </div>
            ) : !inFeishu ? (
              <div className="py-6">
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-4 dark:border-yellow-900 dark:bg-yellow-950">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
                    {t('login.feishuOnlyNotice', '本应用仅支持在飞书客户端中访问，请在飞书工作台中打开。')}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
