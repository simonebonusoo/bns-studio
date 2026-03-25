import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "../../components/Button"
import { useShopCart } from "../context/ShopCartProvider"
import { useShopAuth } from "../context/ShopAuthProvider"
import { apiFetch } from "../lib/api"
import { formatPrice } from "../lib/format"
import { ShopLayout } from "../components/ShopLayout"
import { ShopProduct } from "../types"

export function ShopProductPage() {
  const navigate = useNavigate()
  const { slug = "" } = useParams()
  const { user } = useShopAuth()
  const { addItem, beginCheckout } = useShopCart()
  const [product, setProduct] = useState<ShopProduct | null>(null)
  const [selectedImage, setSelectedImage] = useState("")

  useEffect(() => {
    apiFetch<ShopProduct>(`/store/products/${slug}`).then((data) => {
      setProduct(data)
      setSelectedImage(data.imageUrls[0])
    })
  }, [slug])

  if (!product) {
    return <div className="px-6 py-20 text-center text-white/60">Caricamento scheda prodotto...</div>
  }

  function handleBuyNow() {
    beginCheckout(product, 1)
    navigate(user ? "/shop/checkout" : "/shop/auth", {
      state: { redirectTo: "/shop/checkout" },
    })
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
              <span className="text-lg font-medium text-[#e3f503]">{formatPrice(product.price)}</span>
            </div>
            <p className="mt-5 text-sm leading-7 text-white/70">{product.description}</p>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 text-sm text-white/65">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3">
                <span>Disponibilità</span>
                <span>{product.stock}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3">
                <span>Formato</span>
                <span>Download + uso pronto</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => addItem(product, 1)}>Aggiungi al carrello</Button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="rounded-full border border-white/10 px-5 py-3 text-sm text-white transition hover:border-[#e3f503] hover:text-[#e3f503]"
              >
                Acquista ora
              </button>
            </div>
          </div>
        </div>
      </div>
    </ShopLayout>
  )
}
