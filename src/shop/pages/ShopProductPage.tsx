import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "../../components/Button"
import { useShopCart } from "../context/ShopCartProvider"
import { useShopAuth } from "../context/ShopAuthProvider"
import { apiFetch } from "../lib/api"
import { formatPrice } from "../lib/format"
import { getAvailableFormats, getDefaultFormat, getPriceForFormat, getProductPrimaryImage, isProductPurchasable } from "../lib/product"
import { ShopLayout } from "../components/ShopLayout"
import { ShopProduct } from "../types"

export function ShopProductPage() {
  const navigate = useNavigate()
  const { slug = "" } = useParams()
  const { user } = useShopAuth()
  const { addItem, beginCheckout } = useShopCart()
  const [product, setProduct] = useState<ShopProduct | null>(null)
  const [selectedImage, setSelectedImage] = useState("")
  const [selectedFormat, setSelectedFormat] = useState<"A3" | "A4">("A4")

  useEffect(() => {
    apiFetch<ShopProduct>(`/store/products/${slug}`).then((data) => {
      setProduct(data)
      setSelectedImage(getProductPrimaryImage(data))
      setSelectedFormat(getDefaultFormat(data))
    })
  }, [slug])

  if (!product) {
    return <div className="px-6 py-20 text-center text-white/60">Caricamento scheda prodotto...</div>
  }

  const availableFormats = getAvailableFormats(product)
  const selectedPrice = getPriceForFormat(product, selectedFormat)
  const purchasable = isProductPurchasable(product)

  function handleBuyNow() {
    if (!purchasable) return
    beginCheckout(product, 1, selectedFormat)
    if (!user) {
      window.dispatchEvent(new CustomEvent("bns:open-profile"))
      return
    }

    navigate("/shop/checkout", {
      state: { redirectTo: "/shop/checkout" },
    })
  }

  function handleEditProduct() {
    navigate(`/shop/admin?editProduct=${product.id}`)
  }

  return (
    <ShopLayout eyebrow="Product" title={product.title} intro={product.description}>
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div className="shop-card overflow-hidden">
            <img src={selectedImage} alt={product.title} className="aspect-[4/3] w-full object-cover" />
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {product.imageUrls.map((image) => (
              <button
                key={image}
                type="button"
                onClick={() => setSelectedImage(image)}
                className={`overflow-hidden rounded-[20px] border ${selectedImage === image ? "border-[#e3f503]" : "border-white/10"}`}
              >
                <img src={image} alt={product.title} className="aspect-square w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="shop-card flex flex-col justify-between gap-8 p-6 md:p-8">
          <div>
            <span className="shop-pill">{product.category}</span>
            <div className="mt-5 flex items-center justify-between gap-4">
              <h2 className="text-3xl font-semibold text-white">{product.title}</h2>
              <span className="text-lg font-medium text-[#e3f503]">{formatPrice(selectedPrice)}</span>
            </div>
            <p className="mt-5 text-sm leading-7 text-white/70">{product.description}</p>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 text-sm text-white/65">
              <div className="rounded-2xl border border-white/10 px-4 py-3">
                <span className="text-white">Formato disponibile</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {availableFormats.map((format) => (
                    <button
                      key={format}
                      type="button"
                      onClick={() => setSelectedFormat(format)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        selectedFormat === format ? "border-[#e3f503] text-[#e3f503]" : "border-white/10 text-white/70 hover:border-white/25 hover:text-white"
                      }`}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3">
                <span>Disponibilità</span>
                <span>
                  {product.status === "out_of_stock" || product.stock <= 0 ? "Esaurito" : `${product.stock}`}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3">
                <span>Prezzo formato scelto</span>
                <span>{formatPrice(selectedPrice)}</span>
              </div>
            </div>
            {!purchasable ? (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                {product.status === "out_of_stock" || product.stock <= 0
                  ? "Questo prodotto e visibile ma attualmente non acquistabile."
                  : "Questo prodotto non e disponibile per l'acquisto in questo momento."}
              </div>
            ) : null}
            <div className="flex flex-col gap-3 md:flex-row md:flex-nowrap md:items-center">
              <Button onClick={() => addItem(product, 1, selectedFormat)} disabled={!purchasable} className="w-full md:min-w-0 md:flex-1">
                Aggiungi al carrello
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleBuyNow}
                disabled={!purchasable}
                className="w-full md:min-w-0 md:flex-1"
              >
                Acquista ora
              </Button>
              {user?.role === "admin" ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleEditProduct}
                  className="w-full md:min-w-0 md:flex-1"
                >
                  Modifica
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </ShopLayout>
  )
}
