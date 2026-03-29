import { Link } from "react-router-dom"

import { getButtonClassName } from "../../../components/Button"
import { formatPrice } from "../../lib/format"
import { downloadInvoicePdf } from "../../lib/invoice"
import { ShopOrder, ShopSettings } from "../../types"

type AdminOrdersSectionProps = {
  orders: ShopOrder[]
  shopSettings: ShopSettings
  loadingProfitOrderId: number | null
  containWheel: (event: React.WheelEvent<HTMLElement>) => void
  onOpenOrderProfit: (orderId: number) => void
  onUpdateOrderStatus: (orderId: number, status: string) => void
}

export function AdminOrdersSection({
  orders,
  shopSettings,
  loadingProfitOrderId,
  onOpenOrderProfit,
  onUpdateOrderStatus,
}: AdminOrdersSectionProps) {
  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <article key={order.id} className="shop-card flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-lg font-semibold text-white">{order.orderReference}</p>
            <p className="mt-1 text-sm text-white/60">
              {order.firstName} {order.lastName} · {formatPrice(order.total)}
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 lg:min-w-[320px]">
            <div className="flex flex-wrap gap-2">
              <Link to={`/shop/orders/${order.orderReference}`} className={getButtonClassName({ variant: "profile", size: "sm" })}>
                Visualizza ordine
              </Link>
              <button type="button" onClick={() => onOpenOrderProfit(order.id)} className={getButtonClassName({ variant: "profile", size: "sm" })}>
                {loadingProfitOrderId === order.id ? "Calcolo..." : "Visualizza guadagno"}
              </button>
              {order.status === "paid" || order.status === "shipped" ? (
                <button type="button" onClick={() => downloadInvoicePdf(order, shopSettings)} className={getButtonClassName({ variant: "profile", size: "sm" })}>
                  Scarica ricevuta
                </button>
              ) : null}
            </div>
            <select className="shop-select max-w-48" value={order.status} onChange={(event) => onUpdateOrderStatus(order.id, event.target.value)}>
              <option value="pending">In attesa</option>
              <option value="paid">Pagato</option>
              <option value="shipped">Spedito</option>
            </select>
          </div>
        </article>
      ))}
    </div>
  )
}
