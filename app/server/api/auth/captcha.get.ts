import { setHeader } from 'h3'

import { apiError, ok } from '../../utils/response'
import { issueCaptchaChallenge } from '../../utils/captcha'

export default defineEventHandler(async (event) => {
  try {
    setHeader(event, 'Cache-Control', 'no-store')
    setHeader(event, 'Pragma', 'no-cache')
    setHeader(event, 'Expires', '0')

    const challenge = await issueCaptchaChallenge(event)

    return ok({
      captcha: challenge
    })
  } catch {
    return apiError(event, 500, 'CAPTCHA_ISSUE_FAILED', 'Unable to issue captcha challenge.')
  }
})
