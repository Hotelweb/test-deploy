import { useState } from 'react'
import { t } from '../../lib/i18n'
import { LANGUAGE_BY_CODE } from '../../lib/languages'

export interface BookingFormValue {
  customer_name: string
  customer_first_name: string
  customer_last_name?: string
  customer_email: string
  room_number?: string
  privacy_consent: boolean
  analytics_consent?: boolean
}

interface BookingFormProps {
  hotelName: string
  language: string
  onSubmit: (value: BookingFormValue) => void
  onSkip: () => void
  onBack?: () => void
  loading?: boolean
}

export function BookingForm({ hotelName, language, onSubmit, onSkip, loading }: BookingFormProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [analyticsConsent, setAnalyticsConsent] = useState(false)
  const [errors, setErrors] = useState<{
    firstName?: string
    email?: string
    privacyConsent?: string
  }>({})

  const validate = () => {
    const next: typeof errors = {}
    if (!firstName.trim()) next.firstName = t(language, 'form.required')
    if (!email.trim()) next.email = t(language, 'form.required')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = t(language, 'form.invalid_email')
    }
    if (!privacyConsent) next.privacyConsent = t(language, 'form.required')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const trimmedFirstName = firstName.trim()
    const trimmedLastName = lastName.trim()
    const customerName = [trimmedFirstName, trimmedLastName].filter(Boolean).join(' ')

    onSubmit({
      customer_name: customerName,
      customer_first_name: trimmedFirstName,
      customer_last_name: trimmedLastName || undefined,
      customer_email: email.trim(),
      room_number: roomNumber.trim() || undefined,
      privacy_consent: true,
      analytics_consent: analyticsConsent,
    })
  }

  const languageChips = [language, 'zh', 'ko']
    .filter((code, index, codes) => codes.indexOf(code) === index)
    .map((code) => LANGUAGE_BY_CODE[code])
    .filter(Boolean)
    .slice(0, 3)

  return (
    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto bg-gray-100 px-5 py-6">
      <div className="mx-auto max-w-[326px] rounded-lg bg-white px-6 py-7 shadow-2xl">
        <h2 className="text-center text-[23px] font-extrabold leading-[1.15] tracking-wide text-[#303238] uppercase">
          {hotelName}
        </h2>

        <div className="mt-6 grid grid-cols-3 gap-2" aria-label="Detected language">
          {languageChips.map((langOption) => {
            const isActive = langOption.code === language
            return (
              <div
                key={langOption.code}
                className={`flex h-[42px] items-center justify-center rounded border px-2 text-[14px] font-medium ${
                  isActive
                    ? 'border-[#9da873] bg-[#9da873] text-white'
                    : 'border-[#c7c7c7] bg-white text-[#171717]'
                }`}
              >
                {langOption.code === 'en'
                  ? 'ENGLISH'
                  : langOption.code === 'zh'
                    ? '简体中文'
                    : langOption.nativeName}
              </div>
            )
          })}
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <FormLabel label="NAME" status="MANDATORY" />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className={inputCls(errors.firstName)}
                required
              />
              <input
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className={inputCls()}
              />
            </div>
            {errors.firstName ? <ErrorText>{errors.firstName}</ErrorText> : null}
          </div>

          <div>
            <FormLabel label="EMAIL ADDRESS" status="MANDATORY" />
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className={inputCls(errors.email)}
              required
            />
            {errors.email ? <ErrorText>{errors.email}</ErrorText> : null}
          </div>

          <div>
            <FormLabel label="ROOM NUMBER" status="OPTIONAL" muted />
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="E.g. 504"
              className={inputCls()}
            />
          </div>

          <div className="space-y-3 text-[15px] leading-7 text-[#6a6b70]">
            <Checkbox
              checked={privacyConsent}
              onChange={setPrivacyConsent}
              required
              label={
                <>
                  I agree to the <a className="text-[#1a73e8]">privacy policy</a> and understand
                  that a copy of this conversation will be sent to me by email
                </>
              }
            />
            {errors.privacyConsent ? <ErrorText>{errors.privacyConsent}</ErrorText> : null}

            <Checkbox
              checked={analyticsConsent}
              onChange={setAnalyticsConsent}
              label="I agree that your company may collect data from any and all conversations that take place on the chat for analytical purposes to improve its services"
            />
          </div>
        </div>

        <div className="mt-8">
          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-lg bg-[#2e6729] text-[18px] font-extrabold text-white transition hover:bg-[#275923] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="mx-auto block h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              'START CHAT SESSION'
            )}
          </button>
          <button
            type="button"
            onClick={onSkip}
            disabled={loading}
            className="mt-2 h-8 w-full text-[14px] text-[#42444a] transition hover:text-black disabled:opacity-60"
          >
            Return to Home Page
          </button>
        </div>
      </div>
    </form>
  )
}

function FormLabel({ label, status, muted }: { label: string; status: string; muted?: boolean }) {
  return (
    <div className="mb-1.5 flex items-center justify-between text-[12px] font-medium">
      <span className="text-[#4b4d52]">{label}</span>
      <span className={muted ? 'text-[#4b4d52]' : 'text-[#d92338]'}>{status}</span>
    </div>
  )
}

function Checkbox({
  checked,
  onChange,
  label,
  required,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: React.ReactNode
  required?: boolean
}) {
  return (
    <label className="flex items-start gap-2">
      <input
        type="checkbox"
        checked={checked}
        required={required}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 appearance-none rounded border border-[#c9cdd2] bg-white checked:border-[#2e6729] checked:bg-[#2e6729]"
      />
      <span>{label}</span>
    </label>
  )
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <span className="mt-1 block text-[11px] text-[#d92338]">{children}</span>
}

function inputCls(error?: string) {
  return `h-[40px] w-full rounded border bg-white px-2.5 text-[15px] text-[#333] outline-none placeholder:text-[#858585] focus:border-[#2e6729] focus:ring-1 focus:ring-[#2e6729] ${
    error ? 'border-[#d92338]' : 'border-[#777]'
  }`
}
