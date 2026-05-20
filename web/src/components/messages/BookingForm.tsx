import { useState } from 'react'
import { t } from '../../lib/i18n'
import { ArrowLeftIcon, ArrowRightIcon, CalendarIcon, UserCircleIcon } from '../icons/ServiceIcons'

export interface BookingFormValue {
  customer_name: string
  customer_phone?: string
  customer_email?: string
  customer_country?: string
  guest_count?: number
  check_in_date?: string
  check_out_date?: string
  room_type?: string
  initial_request?: string
}

interface BookingFormProps {
  language: string
  onSubmit: (value: BookingFormValue) => void
  onSkip: () => void
  onBack: () => void
  loading?: boolean
}

export function BookingForm({ language, onSubmit, onSkip, onBack, loading }: BookingFormProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [country, setCountry] = useState('')
  const [guests, setGuests] = useState<number>(2)
  const [checkin, setCheckin] = useState('')
  const [checkout, setCheckout] = useState('')
  const [roomType, setRoomType] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})

  const validate = () => {
    const next: typeof errors = {}
    if (!name.trim()) next.name = t(language, 'form.required')
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = t(language, 'form.invalid_email')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      customer_name: name.trim(),
      customer_phone: phone.trim() || undefined,
      customer_email: email.trim() || undefined,
      customer_country: country.trim() || undefined,
      guest_count: Number.isFinite(guests) ? guests : undefined,
      check_in_date: checkin || undefined,
      check_out_date: checkout || undefined,
      room_type: roomType.trim() || undefined,
      initial_request: message.trim() || undefined,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex-1 flex flex-col overflow-y-auto bg-gradient-to-b from-white to-gray-50/60"
    >
      <div className="px-5 pt-5 pb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-text-muted cursor-pointer"
          aria-label={t(language, 'common.back')}
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h3 className="text-[16px] font-bold text-text leading-tight">
            {t(language, 'form.title')}
          </h3>
          <p className="text-[12px] text-text-light leading-snug mt-0.5">
            {t(language, 'form.subtitle')}
          </p>
        </div>
      </div>

      <div className="px-5 pb-3 grid gap-3">
        <Field label={t(language, 'form.name')} required error={errors.name}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-lighter pointer-events-none">
              <UserCircleIcon className="w-4 h-4" />
            </span>
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t(language, 'form.name_placeholder')}
              className={inputCls(errors.name)}
              style={{ paddingLeft: '2.25rem' }}
              required
            />
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t(language, 'form.phone')}>
            <input
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t(language, 'form.phone_placeholder')}
              className={inputCls()}
            />
          </Field>
          <Field label={t(language, 'form.email')} error={errors.email}>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t(language, 'form.email_placeholder')}
              className={inputCls(errors.email)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t(language, 'form.country')}>
            <input
              type="text"
              autoComplete="country-name"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder={t(language, 'form.country_placeholder')}
              className={inputCls()}
            />
          </Field>
          <Field label={t(language, 'form.guests')}>
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className={selectCls()}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t(language, 'form.checkin')}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-lighter pointer-events-none">
                <CalendarIcon className="w-4 h-4" />
              </span>
              <input
                type="date"
                value={checkin}
                onChange={(e) => setCheckin(e.target.value)}
                className={inputCls()}
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
          </Field>
          <Field label={t(language, 'form.checkout')}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-lighter pointer-events-none">
                <CalendarIcon className="w-4 h-4" />
              </span>
              <input
                type="date"
                value={checkout}
                onChange={(e) => setCheckout(e.target.value)}
                min={checkin || undefined}
                className={inputCls()}
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
          </Field>
        </div>

        <Field label={t(language, 'form.room_type')}>
          <input
            type="text"
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            placeholder={t(language, 'form.room_type_placeholder')}
            className={inputCls()}
          />
        </Field>

        <Field label={t(language, 'form.message')}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t(language, 'form.message_placeholder')}
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white border border-border-light focus:border-primary/40 transition-all resize-none placeholder:text-text-lighter"
          />
        </Field>
      </div>

      <div className="px-5 pb-5 pt-2 sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent flex flex-col gap-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-2xl gradient-primary text-white font-semibold text-[15px] flex items-center justify-center gap-2 hover:shadow-card-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {t(language, 'form.start_chat')}
              <ArrowRightIcon className="w-4 h-4" />
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={loading}
          className="w-full h-10 rounded-2xl text-text-light hover:text-text text-[13px] font-medium transition-colors duration-200 cursor-pointer"
        >
          {t(language, 'form.skip_to_chat')}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-[12px] font-semibold text-text-muted mb-1.5">
        {label}
        {required ? <span className="text-red-500 ml-0.5">*</span> : null}
      </span>
      {children}
      {error ? <span className="block text-[11px] text-red-600 mt-1">{error}</span> : null}
    </label>
  )
}

function inputCls(error?: string) {
  return `w-full px-3 py-2.5 rounded-xl bg-gray-50 text-[14px] focus:outline-none focus:ring-2 ${
    error
      ? 'ring-red-200 border-red-300'
      : 'focus:ring-primary/30 focus:bg-white focus:border-primary/40 border-border-light'
  } border transition-all placeholder:text-text-lighter`
}

function selectCls() {
  return 'w-full px-3 py-2.5 rounded-xl bg-gray-50 text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white border border-border-light focus:border-primary/40 transition-all cursor-pointer'
}
