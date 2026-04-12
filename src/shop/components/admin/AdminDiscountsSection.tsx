import { useState, type FormEvent } from "react"

import { Button, getButtonClassName, getDangerButtonClassName } from "../../../components/Button"
import { formatPrice } from "../../lib/format"
import { ConfirmActionModal } from "./ConfirmActionModal"

type Coupon = {
  id: number
  code: string
  type: "percentage" | "fixed" | "first_registration"
  amount: number
  active: boolean
  usageLimit?: number | null
  expiresAt?: string | null
}

type DiscountRule = {
  id: number
  name: string
  description?: string | null
  ruleType: "quantity_percentage" | "free_shipping_quantity" | "subtotal_fixed" | "first_registration"
  threshold: number
  discountType: "percentage" | "shipping" | "fixed"
  amount: number
  priority: number
  startsAt?: string | null
  endsAt?: string | null
  active: boolean
}

type CouponFormState = {
  code: string
  type: "percentage" | "fixed" | "first_registration"
  amount: string
  expiresAt: string
  usageLimit: string
  active: boolean
}

type RuleFormState = {
  name: string
  description: string
  ruleType: "quantity_percentage" | "free_shipping_quantity" | "subtotal_fixed" | "first_registration"
  threshold: string
  discountType: "percentage" | "shipping" | "fixed"
  amount: string
  priority: number
  startsAt: string
  endsAt: string
  active: boolean
}

type AdminDiscountsSectionProps = {
  editingCouponId: number | null
  couponForm: CouponFormState
  coupons: Coupon[]
  editingRuleId: number | null
  ruleForm: RuleFormState
  rules: DiscountRule[]
  shippingCostInput: string
  onSaveCoupon: (event: FormEvent) => void
  onCancelCouponEdit: () => void
  onCouponFormChange: (next: CouponFormState) => void
  onEditCoupon: (coupon: Coupon) => void
  onDeleteCoupon: (couponId: number) => void
  onSaveRule: (event: FormEvent) => void
  onCancelRuleEdit: () => void
  onRuleFormChange: (next: RuleFormState) => void
  onEditRule: (rule: DiscountRule) => void
  onDeleteRule: (ruleId: number) => void
  onSaveSettings: (event: FormEvent) => void
  settingValue: (key: string, fallback?: string) => string
  updateSetting: (key: string, value: string) => void
  onShippingCostInputChange: (value: string) => void
  getCouponAmountLabel: (type: CouponFormState["type"]) => string
  getRuleThresholdLabel: (type: RuleFormState["ruleType"]) => string
  getRuleAmountLabel: (type: RuleFormState["discountType"]) => string
}

export function AdminDiscountsSection({
  editingCouponId,
  couponForm,
  coupons,
  editingRuleId,
  ruleForm,
  rules,
  shippingCostInput,
  onSaveCoupon,
  onCancelCouponEdit,
  onCouponFormChange,
  onEditCoupon,
  onDeleteCoupon,
  onSaveRule,
  onCancelRuleEdit,
  onRuleFormChange,
  onEditRule,
  onDeleteRule,
  onSaveSettings,
  settingValue,
  updateSetting,
  onShippingCostInputChange,
  getCouponAmountLabel,
  getRuleThresholdLabel,
  getRuleAmountLabel,
}: AdminDiscountsSectionProps) {
  const [pendingDelete, setPendingDelete] = useState<
    | { type: "coupon"; id: number }
    | { type: "rule"; id: number }
    | null
  >(null)

  return (
    <>
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={onSaveCoupon} className="shop-card h-full space-y-4 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-white">{editingCouponId ? "Modifica coupon" : "Crea coupon"}</h2>
            {editingCouponId ? (
              <button type="button" onClick={onCancelCouponEdit} className={getButtonClassName({ variant: "profile", size: "sm" })}>
                Annulla
              </button>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/65">Codice coupon</label>
            <input className="shop-input" placeholder="Codice coupon" value={couponForm.code} onChange={(event) => onCouponFormChange({ ...couponForm, code: event.target.value.toUpperCase() })} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-white/65">Tipo coupon</label>
              <select className="shop-select" value={couponForm.type} onChange={(event) => onCouponFormChange({ ...couponForm, type: event.target.value as CouponFormState["type"] })}>
                <option value="percentage">Percentuale</option>
                <option value="fixed">Importo fisso</option>
                <option value="first_registration">Prima registrazione</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/65">{getCouponAmountLabel(couponForm.type)}</label>
              <input className="shop-input" type="number" step={couponForm.type === "fixed" ? "0.01" : "1"} placeholder={getCouponAmountLabel(couponForm.type)} value={couponForm.amount} onChange={(event) => onCouponFormChange({ ...couponForm, amount: event.target.value })} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-white/65">Data di scadenza</label>
              <input className="shop-input" type="date" value={couponForm.expiresAt} onChange={(event) => onCouponFormChange({ ...couponForm, expiresAt: event.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/65">Limite utilizzi</label>
              <input className="shop-input" type="number" placeholder="Numero massimo utilizzi" value={couponForm.usageLimit} onChange={(event) => onCouponFormChange({ ...couponForm, usageLimit: event.target.value })} />
            </div>
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70">
            <input type="checkbox" checked={couponForm.active} onChange={(event) => onCouponFormChange({ ...couponForm, active: event.target.checked })} />
            Coupon attivo
          </label>
          <Button type="submit" variant="cart">
            {editingCouponId ? "Aggiorna coupon" : "Crea coupon"}
          </Button>
        </form>

        <div className="shop-card flex h-full min-h-0 flex-col space-y-4 p-6">
          <h2 className="text-xl font-semibold text-white">Coupon esistenti</h2>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="rounded-2xl border border-white/10 px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">{coupon.code}</p>
                    <p className="mt-1 text-sm text-white/60">
                      {coupon.type === "first_registration" ? "Prima registrazione · " : ""}
                      {coupon.type === "percentage" || coupon.type === "first_registration" ? `${coupon.amount}%` : formatPrice(coupon.amount)} · {coupon.active ? "Attivo" : "Disattivato"}
                    </p>
                    {coupon.expiresAt ? <p className="mt-1 text-xs text-white/45">Valido fino al {new Date(coupon.expiresAt).toLocaleDateString("it-IT")}</p> : null}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => onEditCoupon(coupon)} className={getButtonClassName({ variant: "profile", size: "sm" })}>
                      Modifica
                    </button>
                    <button type="button" onClick={() => setPendingDelete({ type: "coupon", id: coupon.id })} className={getDangerButtonClassName({ size: "sm" })}>
                      Elimina
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={onSaveRule} className="shop-card h-full space-y-4 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-white">{editingRuleId ? "Modifica regola sconto" : "Crea regola sconto"}</h2>
            {editingRuleId ? (
              <button type="button" onClick={onCancelRuleEdit} className={getButtonClassName({ variant: "profile", size: "sm" })}>
                Annulla
              </button>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/65">Titolo regola</label>
            <input className="shop-input" placeholder="Titolo regola" value={ruleForm.name} onChange={(event) => onRuleFormChange({ ...ruleForm, name: event.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/65">Descrizione opzionale</label>
            <textarea className="shop-textarea min-h-24 resize-none" placeholder="Descrizione opzionale" value={ruleForm.description} onChange={(event) => onRuleFormChange({ ...ruleForm, description: event.target.value })} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-white/65">Tipo regola</label>
              <select
                className="shop-select"
                value={ruleForm.ruleType}
                onChange={(event) => {
                  const nextRuleType = event.target.value as RuleFormState["ruleType"]
                  onRuleFormChange({
                    ...ruleForm,
                    ruleType: nextRuleType,
                    ...(nextRuleType === "first_registration" ? { threshold: "1", discountType: "percentage" } : {}),
                  })
                }}
              >
                <option value="quantity_percentage">Sconto percentuale per quantita minima</option>
                <option value="free_shipping_quantity">Spedizione gratuita per quantita minima</option>
                <option value="subtotal_fixed">Sconto fisso per subtotale minimo</option>
                <option value="first_registration">Prima registrazione</option>
              </select>
              {ruleForm.ruleType === "first_registration" ? (
                <p className="text-xs leading-5 text-white/45">
                  Genera un codice casuale, univoco e monouso quando un guest si registra dal popup.
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/65">Modalità sconto</label>
              <select
                className="shop-select"
                value={ruleForm.discountType}
                disabled={ruleForm.ruleType === "first_registration"}
                onChange={(event) => onRuleFormChange({ ...ruleForm, discountType: event.target.value as RuleFormState["discountType"] })}
              >
                <option value="percentage">Percentuale</option>
                <option value="shipping">Spedizione</option>
                <option value="fixed">Importo fisso</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm text-white/65">{getRuleThresholdLabel(ruleForm.ruleType)}</label>
              <input className="shop-input" type="number" step={ruleForm.ruleType === "subtotal_fixed" ? "0.01" : "1"} placeholder={getRuleThresholdLabel(ruleForm.ruleType)} value={ruleForm.threshold} onChange={(event) => onRuleFormChange({ ...ruleForm, threshold: event.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/65">{getRuleAmountLabel(ruleForm.discountType)}</label>
              <input className="shop-input" type="number" step={ruleForm.discountType === "fixed" ? "0.01" : "1"} placeholder={getRuleAmountLabel(ruleForm.discountType)} value={ruleForm.discountType === "shipping" ? "0" : ruleForm.amount} disabled={ruleForm.discountType === "shipping"} onChange={(event) => onRuleFormChange({ ...ruleForm, amount: event.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/65">Priorità</label>
              <input className="shop-input" type="number" placeholder="Priorità" value={ruleForm.priority} onChange={(event) => onRuleFormChange({ ...ruleForm, priority: Number(event.target.value) })} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-white/65">Data inizio validità</label>
              <input className="shop-input" type="datetime-local" value={ruleForm.startsAt} onChange={(event) => onRuleFormChange({ ...ruleForm, startsAt: event.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/65">Data fine validità</label>
              <input className="shop-input" type="datetime-local" value={ruleForm.endsAt} onChange={(event) => onRuleFormChange({ ...ruleForm, endsAt: event.target.value })} />
            </div>
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70">
            <input type="checkbox" checked={ruleForm.active} onChange={(event) => onRuleFormChange({ ...ruleForm, active: event.target.checked })} />
            Regola attiva
          </label>
          <Button type="submit" variant="cart">
            {editingRuleId ? "Aggiorna regola" : "Crea regola"}
          </Button>
        </form>

        <div className="shop-card flex h-full min-h-0 flex-col space-y-4 p-6">
          <h2 className="text-xl font-semibold text-white">Regole sconto esistenti</h2>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
            {rules.map((rule) => (
              <div key={rule.id} className="rounded-2xl border border-white/10 px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">{rule.name}</p>
                    <p className="mt-1 text-sm text-white/60">
                      {rule.active ? "Attiva" : "Disattivata"} ·{" "}
                      {rule.ruleType === "first_registration"
                        ? "prima registrazione"
                        : rule.ruleType === "subtotal_fixed"
                          ? `soglia ${formatPrice(rule.threshold)}`
                          : `soglia ${rule.threshold}`} ·{" "}
                      {rule.discountType === "fixed" ? `valore ${formatPrice(rule.amount)}` : rule.discountType === "percentage" ? `valore ${rule.amount}%` : "spedizione gratuita"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => onEditRule(rule)} className={getButtonClassName({ variant: "profile", size: "sm" })}>
                      Modifica
                    </button>
                    <button type="button" onClick={() => setPendingDelete({ type: "rule", id: rule.id })} className={getDangerButtonClassName({ size: "sm" })}>
                      Elimina
                    </button>
                  </div>
                </div>
                {rule.description ? <p className="mt-2 text-sm text-white/55">{rule.description}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={onSaveSettings} className="shop-card flex h-full flex-col space-y-4 p-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Impostazioni PayPal</h2>
          <p className="mt-2 text-sm text-white/60">
            Inserisci l&apos;email business PayPal oppure un link PayPal.Me reale. L&apos;email business ha priorita e replica il flusso del vecchio shop.
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-white/65">Nome shop mostrato nel checkout</label>
              <input className="shop-input" placeholder="Nome shop" value={settingValue("storeName", "BNS Studio Shop")} onChange={(event) => updateSetting("storeName", event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/65">Email business PayPal</label>
              <input className="shop-input" placeholder="Email business PayPal" value={settingValue("paypalBusinessEmail")} onChange={(event) => updateSetting("paypalBusinessEmail", event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/65">Email contatto sito</label>
              <input className="shop-input" placeholder="Email contatto sito" value={settingValue("contactEmail", "bnsstudio@gmail.com")} onChange={(event) => updateSetting("contactEmail", event.target.value)} />
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-white/65">Link PayPal.Me</label>
              <input className="shop-input" placeholder="Link PayPal.Me" value={settingValue("paypalMeLink")} onChange={(event) => updateSetting("paypalMeLink", event.target.value)} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-white/65">Valuta</label>
                <input className="shop-input" placeholder="Valuta" value={settingValue("currencyCode", "EUR")} onChange={(event) => updateSetting("currencyCode", event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/65">Spedizione standard (€)</label>
                <input className="shop-input" type="number" step="0.01" placeholder="Spedizione standard" value={shippingCostInput} onChange={(event) => onShippingCostInputChange(event.target.value)} />
              </div>
            </div>
          </div>
        </div>
        <Button type="submit" variant="cart" className="mt-auto">
          Salva impostazioni PayPal
        </Button>
      </form>
    </div>
    <ConfirmActionModal
      open={Boolean(pendingDelete)}
      title={pendingDelete?.type === "coupon" ? "Elimina coupon" : "Elimina regola sconto"}
      description={
        pendingDelete?.type === "coupon"
          ? "Sei sicuro di voler eliminare questo coupon?"
          : "Sei sicuro di voler eliminare questa regola sconto?"
      }
      onCancel={() => setPendingDelete(null)}
      onConfirm={async () => {
        if (!pendingDelete) return
        if (pendingDelete.type === "coupon") {
          await onDeleteCoupon(pendingDelete.id)
        } else {
          await onDeleteRule(pendingDelete.id)
        }
        setPendingDelete(null)
      }}
    />
    </>
  )
}
