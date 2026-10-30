import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  adminBillingCode,
  adminGetFullOverview,
  adminIssueLicenseCode,
  adminSaveCouponCode,
  adminSetCouponActiveCode,
  adminSetCouponPublicCode,
  adminDeleteCouponCode,
  adminSetLicenseStatusCode,
  adminDeleteLicenseCode,
  adminSetDeviceRevokedCode,
  adminUpdateGateGetCode,
  adminUpdateGateSetCode,
} from "@/lib/admin-code.functions";
import { adminOrdersCode, adminActivateOrderCode, adminCreateManualOrderCode, adminDeleteOrderCode } from "@/lib/admin-dash.functions";
import {
  adminDeleteFreeResource,
  adminGetFreeResources,
  adminSaveFreeResource,
  adminUploadFreeResourceImage,
  type FreeResource,
} from "@/lib/free-resources.functions";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  Copy,
  CreditCard,
  Key,
  Laptop,
  Package,
  RefreshCw,
  Rocket,
  Tag,
  Ticket,
  Trash2,
  Download,
  ImagePlus,
} from "lucide-react";
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';

const WA_NUMBER = "8801345407572";

type Product = {
  id: string;
  serial: string;
  name: string;
  bundle: string;
  planKeys: string[];
  planChoices: { key: string; label: string; days: number }[];
  hasGate: boolean;
};

const PRODUCTS: Product[] = [
  {
    id: "text",
    serial: "01",
    name: "Ghostae Text",
    bundle: "com.ghost.text",
    planKeys: ["lifetime", "text_lifetime", "text"],
    planChoices: [
      { key: "lifetime", label: "Lifetime (কখনো শেষ হবে না)", days: 0 },
      { key: "free", label: "Free trial (৭ দিন)", days: 7 },
    ],
    hasGate: true,
  },
  {
    id: "caption",
    serial: "02",
    name: "Ghostae Caption",
    bundle: "com.ghostae.caption",
    planKeys: ["light", "lite", "basic", "pro", "ultra", "team", "caption", "free"],
    planChoices: [
      { key: "basic", label: "Light — ৩ মাস", days: 90 },
      { key: "pro", label: "Pro — ১ বছর", days: 365 },
      { key: "free", label: "Free (২ মিনিট/দিন)", days: 0 },
    ],
    hasGate: false,
  },
  {
    id: "cache",
    serial: "03",
    name: "Ghostae Cache Light",
    bundle: "com.ghostae.cache",
    planKeys: ["cache", "cache_lifetime", "cache_light"],
    planChoices: [
      { key: "cache_lifetime", label: "Lifetime (কখনো শেষ হবে না)", days: 0 },
      { key: "free", label: "Free trial (৭ দিন)", days: 7 },
    ],
    hasGate: false,
  },
];

const card =
  "rounded-xl border border-line bg-surface p-4   sm:p-5";
const input =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-primary   ";
const label =
  "text-[11px] font-semibold uppercase tracking-wider text-muted-fg ";

const money = (n: number, c = "BDT") => `${c === "BDT" ? "৳" : c + " "}${Number(n || 0).toLocaleString()}`;
const when = (s?: string | null) => (s ? new Date(s).toLocaleString() : "—");
const planOf = (p: unknown) => String(p ?? "").toLowerCase();

export function AdminProductsHub({ adminCode }: { adminCode: string }) {
  const queryClient = useQueryClient();
  const publishCoupon = useServerFn(adminSetCouponPublicCode);
  const loadBilling = useServerFn(adminBillingCode);
  const loadOverview = useServerFn(adminGetFullOverview);
  const loadOrders = useServerFn(adminOrdersCode);
  const activateOrder = useServerFn(adminActivateOrderCode);
  const createManual = useServerFn(adminCreateManualOrderCode);
  const issue = useServerFn(adminIssueLicenseCode);
  const saveCoupon = useServerFn(adminSaveCouponCode);
  const toggleCoupon = useServerFn(adminSetCouponActiveCode);
  const deleteCoupon = useServerFn(adminDeleteCouponCode);
  const setLicenseStatus = useServerFn(adminSetLicenseStatusCode);
  const deleteLicense = useServerFn(adminDeleteLicenseCode);
  const deleteOrder = useServerFn(adminDeleteOrderCode);
  const setDeviceRevoked = useServerFn(adminSetDeviceRevokedCode);
  const gateGet = useServerFn(adminUpdateGateGetCode);
  const gateSet = useServerFn(adminUpdateGateSetCode);
  const loadResources = useServerFn(adminGetFreeResources);
  const saveResource = useServerFn(adminSaveFreeResource);
  const uploadResourceImage = useServerFn(adminUploadFreeResourceImage);
  const deleteResource = useServerFn(adminDeleteFreeResource);

  const [billing, setBilling] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [tab, setTab] = useState("orders");
  const [resources, setResources] = useState<FreeResource[]>([]);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [b, o, ords, free] = await Promise.all([
        loadBilling({ data: { code: adminCode } }),
        loadOverview({ data: { code: adminCode } }),
        loadOrders({ data: { code: adminCode } }),
        loadResources(),
      ]);
      setBilling(b);
      setOverview(o);
      setOrders((ords as any).orders ?? []);
      setResources(free);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ডাটা লোড করা যায়নি।");
    }
  }, [adminCode, loadBilling, loadOverview, loadOrders, loadResources]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const product = PRODUCTS.find((p) => p.id === open) ?? null;

  const bucket = useCallback(
    (p: Product) => {
      const keys = p.planKeys;
      const match = (v: unknown) => keys.includes(planOf(v));
      const licenses = ((overview?.licenses ?? []) as any[]).filter((l) => match(l.plan));
      const ords = orders.filter((o) => match(o.plan));
      const devices = ((overview?.activations ?? []) as any[]).filter((a) =>
        licenses.some((l) => l.id === a.license_id),
      );
      const plans = ((billing?.plans ?? []) as any[]).filter((pl) => match(pl.plan_key));
      const coupons = ((billing?.coupons ?? []) as any[]).filter(
        (c) => ((c.plans ?? []) as string[]).some((k) => keys.includes(planOf(k))),
      );
      const publicOffers = ((billing?.publicOffers ?? []) as any[]).filter((o) =>
        keys.includes(planOf(o.plan)),
      );
      return { licenses, orders: ords, devices, plans, coupons, publicOffers };
    },
    [overview, orders, billing],
  );

  if (error)
    return (
      <div className={card}>
        <p className="text-sm text-danger">{error}</p>
      </div>
    );

  if (!product)
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-fg">
            প্রতিটি প্রোডাক্টে ক্লিক করলে তার অর্ডার, লাইসেন্স ও কুপন ভিতরেই পাওয়া যাবে।
          </p>
          <button onClick={refresh} className="rounded-lg border border-line p-2 text-muted-fg" aria-label="Reload">
            <RefreshCw size={14} />
          </button>
        </div>
        {PRODUCTS.map((p) => {
          const b = bucket(p);
          const pending = b.orders.filter((o) => o.status === "pending").length;
          return (
            <button
              key={p.id}
              onClick={() => {
                setOpen(p.id);
                setTab("orders");
              }}
              className={`${card} flex w-full items-center gap-4 text-left transition hover:border-primary`}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 font-bold text-primary">
                {p.serial}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-bold">{p.name}</span>
                <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-fg">
                  <span>{pending} পেন্ডিং অর্ডার</span>
                  <span>{b.licenses.filter((l) => l.status === "active").length} একটিভ লাইসেন্স</span>
                  <span>{b.devices.filter((d) => !d.revoked).length} ডিভাইস</span>
                  <span className="font-mono opacity-60">{p.bundle}</span>
                </span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-faint" />
            </button>
          );
        })}
        <FreeResourcesAdmin
          resources={resources}
          busy={busy}
          onSave={async (resource) => {
            setBusy(resource.id ?? "new-resource");
            try {
              await saveResource({ data: resource });
              await refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : "রিসোর্স সেভ হয়নি।");
            } finally {
              setBusy(null);
            }
          }}
          onDelete={async (id) => {
            setBusy(id);
            try {
              await deleteResource({ data: { id } });
              await refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : "রিসোর্স ডিলিট হয়নি।");
            } finally {
              setBusy(null);
            }
          }}
          onUpload={async (file, slug) => {
            const webp = await compressResourceImage(file);
            const bytes = await blobToBase64(webp);
            return uploadResourceImage({ data: { bytes, slug } });
          }}
        />
      </div>
    );

  const b = bucket(product);
  const TABS = [
    { id: "orders", label: "অর্ডার ও পেমেন্ট", icon: CreditCard },
    { id: "licenses", label: "লাইসেন্স ও ডিভাইস", icon: Key },
    { id: "coupons", label: "কুপন", icon: Ticket },
    ...(product.hasGate ? [{ id: "update", label: "আপডেট", icon: Rocket }] : []),
  ];

  return (
    <div className="space-y-4">
      <div className={`${card} flex items-center gap-3`}>
        <button
          onClick={() => setOpen(null)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted-fg"
          aria-label="Back"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold sm:text-lg">{product.name}</h3>
          <p className="truncate font-mono text-[11px] text-muted-fg">{product.bundle}</p>
        </div>
        <button onClick={refresh} className="rounded-lg border border-line p-2 text-muted-fg" aria-label="Reload">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
              tab === t.id
                ? "bg-primary text-white"
                : "border border-line text-muted-fg "
            }`}
          >
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <OrdersTab
          rows={b.orders}
          busy={busy}
          plans={product.planChoices}
          onCreate={async (v) => {
            setBusy("manual");
            try {
              await createManual({ data: { code: adminCode, ...v } });
              await refresh();
              return true;
            } catch (e) {
              setError(e instanceof Error ? e.message : "অর্ডার তৈরি করা যায়নি।");
              return false;
            } finally {
              setBusy(null);
            }
          }}
          onDeleteOrder={async (row) => {
            if (!confirm(row.license_key ? "এই অর্ডার আর এর license দুটোই ডিলিট হবে। নিশ্চিত?" : "এই অর্ডারটি ডিলিট হবে। নিশ্চিত?")) return;
            setBusy(row.id);
            try {
              await deleteOrder({ data: { code: adminCode, order_id: row.id, with_license: true } });
              await refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : "অর্ডার ডিলিট হয়নি।");
            } finally {
              setBusy(null);
            }
          }}
          onApprove={async (row) => {
            setBusy(row.id);
            try {
              const res: any = await activateOrder({ data: { code: adminCode, order_id: row.id, seats: 2, expires_in_days: 0 } });
              await refresh();
              if (res?.license_key) navigator.clipboard?.writeText(res.license_key);
            } catch (e) {
              setError(e instanceof Error ? e.message : "অনুমোদন করা যায়নি।");
            } finally {
              setBusy(null);
            }
          }}
        />
      )}

      {tab === "licenses" && (
        <LicensesTab
          product={product}
          licenses={b.licenses}
          activations={b.devices}
          busy={busy}
          onIssue={async (plan, days, seats, qty, email, customKey) => {
            setBusy("issue");
            try {
              const res: any = await issue({
                data: {
                  code: adminCode,
                  email,
                  plan,
                  quantity: qty,
                  max_activations: seats,
                  expires_in_days: days,
                  custom_key: customKey ?? "",
                  notes: `${product.name} — admin issued`,
                },
              });

              await refresh();
              return (res.created ?? []).map((c: any) => c.license_key);
            } catch (e) {
              setError(e instanceof Error ? e.message : "কী তৈরি হয়নি।");
              return [];
            } finally {
              setBusy(null);
            }
          }}
          onStatus={async (id, status) => {
            await setLicenseStatus({ data: { code: adminCode, license_id: id, status } });
            await refresh();
          }}
          onDelete={async (id) => {
            await deleteLicense({ data: { code: adminCode, license_id: id } });
            await refresh();
          }}
          onDevice={async (id, revoked) => {
            await setDeviceRevoked({ data: { code: adminCode, activation_id: id, revoked } });
            await refresh();
          }}
        />
      )}

      {tab === "coupons" && (
        <CouponsTab
          product={product}
          coupons={b.coupons}
          busy={busy}
          onSave={async (form) => {
            setBusy("coupon");
            try {
              await saveCoupon({
                data: {
                  code: adminCode,
                  coupon_code: form.coupon_code,
                  description: `${product.name}`,
                  percent_off: form.percent_off,
                  flat_off: form.flat_off,
                  plans: product.planKeys,
                  max_redemptions: form.max_redemptions,
                  expires_in_days: form.expires_in_days,
                  active: true,
                },
              });
              await refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : "কুপন সেভ হয়নি।");
            } finally {
              setBusy(null);
            }
          }}
          onToggle={async (id, active) => {
            await toggleCoupon({ data: { code: adminCode, id, active } });
            await refresh();
          }}
          onPublic={async (id, is_public) => {
            setBusy(id);
            try {
              await publishCoupon({ data: { id, is_public } });
              await refresh();
              await queryClient.invalidateQueries({ queryKey: ['published-coupon-banners'] });
            } catch (e) { setError(e instanceof Error ? e.message : 'কুপন প্রকাশ হয়নি।'); }
            finally { setBusy(null); }
          }}
          onDelete={async (id) => {
            await deleteCoupon({ data: { code: adminCode, id } });
            await refresh();
          }}
        />
      )}

      {tab === "update" && product.hasGate && (
        <UpdateTab adminCode={adminCode} gateGet={gateGet} gateSet={gateSet} />
      )}
    </div>
  );
}

function FreeResourcesAdmin({
  resources,
  busy,
  onSave,
  onDelete,
  onUpload,
}: {
  resources: FreeResource[];
  busy: string | null;
  onSave: (resource: Omit<FreeResource, "id"> & { id?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpload: (file: File, slug: string) => Promise<{ image_url: string }>;
}) {
  const empty = {
    title: "",
    slug: "",
    description: "",
    image_url: "",
    download_url: "",
    tutorial_url: "",
    is_published: true,
    sort_order: 100,
  };
  const [form, setForm] = useState<Omit<FreeResource, "id"> & { id?: string }>(empty);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  return (
    <div className={`${card} space-y-3`}>
      <div className="flex items-center gap-2">
        <Download size={16} className="text-primary" />
        <h3 className="font-bold">Free Extensions &amp; Resources</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>নাম<input className={`mt-1 ${input}`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.id ? form.slug : slugify(e.target.value) })} /></label>
        <label className={label}>শেয়ার লিংক নাম<input className={`mt-1 ${input}`} value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} placeholder="free-extension-name" /></label>
        <div className="sm:col-span-2">
          <p className={label}>কভার ছবি</p>
          <label className={`mt-1 flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed p-3 transition ${imageBusy ? "border-primary bg-primary/5" : "border-line hover:border-primary hover:bg-primary/5"}`}>
            {(preview || form.image_preview_url) ? <img src={preview || form.image_preview_url || ""} alt="Preview" className="h-20 w-32 rounded-lg object-cover" /> : <span className="grid h-20 w-32 place-items-center rounded-lg bg-surface-2 text-faint"><ImagePlus size={22} /></span>}
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{imageBusy ? "আপলোড হচ্ছে…" : (preview || form.image_preview_url) ? "ছবি বদলাতে click করুন" : "ছবি বাছাই করতে click করুন"}</span>
              <span className="block text-[11px] text-muted-fg">JPG, PNG, WebP — যেকোনো সাইজ, নিজে থেকে ছোট করে নেওয়া হবে</span>
              {imageError && <span className="mt-1 block text-[11px] font-semibold text-danger">{imageError}</span>}
            </span>
            <input type="file" accept="image/*" className="sr-only" disabled={imageBusy} onChange={async (e) => {
              const file = e.target.files?.[0];
              const slug = form.slug || slugify(form.title) || `resource-${Date.now()}`;
              if (!file) return;
              if (!form.slug) setForm((c) => ({ ...c, slug }));
              setImageBusy(true);
              setImageError(null);
              try {
                const result = await onUpload(file, slug);
                setForm((current) => ({ ...current, slug: current.slug || slug, image_url: result.image_url }));
                setPreview(URL.createObjectURL(file));
              } catch (err) {
                setImageError(err instanceof Error ? err.message : "ছবি আপলোড হয়নি। আবার চেষ্টা করুন।");
              } finally { setImageBusy(false); e.target.value = ""; }
            }} />
          </label>
        </div>
        <label className={label}>ডাউনলোড লিংক<input className={`mt-1 ${input}`} type="url" value={form.download_url} onChange={(e) => setForm({ ...form, download_url: e.target.value })} placeholder="Google Drive বা অন্য লিংক" /></label>
        <label className={label}>টিউটোরিয়াল লিংক<input className={`mt-1 ${input}`} type="url" value={form.tutorial_url ?? ""} onChange={(e) => setForm({ ...form, tutorial_url: e.target.value })} placeholder="YouTube, Drive, PDF বা অন্য লিংক" /></label>
      </div>
      <label className={label}>ছোট বিবরণ<textarea className={`mt-1 min-h-20 ${input}`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
      <div className="flex flex-wrap items-end gap-3">
        <label className={label}>ক্রম<input className={`mt-1 w-24 ${input}`} type="number" min={0} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })} /></label>
        <label className="flex h-9 items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} /> প্রকাশ করুন</label>
        <button disabled={!form.title.trim() || !form.slug || !form.download_url.trim() || busy !== null || imageBusy} onClick={async () => { await onSave(form); setForm(empty); setPreview(null); }} className="h-9 rounded-lg bg-primary px-4 text-xs font-bold text-white transition hover:bg-primary-hover disabled:opacity-50">{form.id ? "আপডেট করুন" : "রিসোর্স যোগ করুন"}</button>
        {form.id && <button onClick={() => { setForm(empty); setPreview(null); }} className="h-9 rounded-lg border border-line px-4 text-xs font-bold">বাতিল</button>}
      </div>
      <div className="border-t border-line pt-4">
        <p className={`${label} mb-2`}>সব রিসোর্স ({resources.length})</p>
        {resources.length === 0 && <p className="text-xs text-faint">এখনো কোনো ফ্রি রিসোর্স যোগ করা হয়নি।</p>}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => <div key={resource.id} className={`overflow-hidden rounded-xl border bg-surface transition ${form.id === resource.id ? "border-primary" : "border-line"}`}>
            {resource.image_preview_url ? <img src={resource.image_preview_url} alt={resource.title} loading="lazy" className="aspect-video w-full object-cover" /> : <div className="grid aspect-video w-full place-items-center bg-surface-2 text-faint"><ImagePlus size={20} /></div>}
            <div className="space-y-2 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-2 text-sm font-bold">{resource.title}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${resource.is_published ? "bg-success/10 text-success" : "bg-surface-2 text-muted-fg"}`}>{resource.is_published ? "Live" : "Hidden"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex-1 text-[11px] text-faint">ক্রম {resource.sort_order}</span>
                <button onClick={() => { setForm(resource); setPreview(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold hover:bg-surface-2">Edit</button>
                <button disabled={busy === resource.id} onClick={() => { if (confirm("এই রিসোর্স ডিলিট হবে। নিশ্চিত?")) onDelete(resource.id); }} aria-label="Delete resource" className="rounded-lg p-2 text-danger hover:bg-danger/10"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>)}
        </div>
      </div>
    </div>
  );
}

async function loadImage(file: File): Promise<CanvasImageSource & { width: number; height: number }> {
  try {
    return await createImageBitmap(file);
  } catch {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode().catch(() => { throw new Error("এই ছবিটি খোলা যাচ্ছে না। JPG বা PNG ব্যবহার করুন।"); });
    return img;
  }
}

async function compressResourceImage(file: File): Promise<Blob> {
  const MAX = 140 * 1024;
  const src = await loadImage(file);
  let width = Math.min(src.width, 1280);
  let height = Math.round(src.height * (width / src.width));
  let quality = 0.85;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("ব্রাউজার ছবি প্রসেস করতে পারছে না।");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
    let blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", quality));
    if (!blob || blob.type !== "image/webp") blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
    if (blob && blob.size <= MAX) return blob;
    quality = Math.max(0.5, quality - 0.07);
    width *= 0.85;
    height *= 0.85;
  }
  throw new Error("ছবিটি ছোট করা গেল না। অন্য ছবি চেষ্টা করুন।");
}

async function blobToBase64(blob: Blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/* ------------------------------- Orders ------------------------------- */

function ManualOrderForm({
  plans,
  busy,
  onCreate,
}: {
  plans: { key: string; label: string }[];
  busy: string | null;
  onCreate: (v: any) => Promise<boolean>;
}) {
  const [f, setF] = useState({ email: "", customer_name: "", plan: plans[0]?.key ?? "", amount: "", payment_method: "bkash", transaction_id: "" });
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  const inp = "w-full rounded-lg border border-line bg-transparent px-3 py-2 text-xs ";
  return (
    <form
      className={`${card} space-y-2`}
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await onCreate({ ...f, amount: Number(f.amount) || 0 });
        if (ok) setF({ ...f, email: "", customer_name: "", amount: "", transaction_id: "" });
      }}
    >
      <p className="text-sm font-bold">ম্যানুয়াল অর্ডার যোগ করুন</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <input required type="email" placeholder="Email *" value={f.email} onChange={set("email")} className={inp} />
        <input placeholder="নাম" value={f.customer_name} onChange={set("customer_name")} className={inp} />
        <select value={f.plan} onChange={set("plan")} className={inp}>
          {plans.map((p) => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>
        <input required type="number" min={0} placeholder="টাকা *" value={f.amount} onChange={set("amount")} className={inp} />
        <select value={f.payment_method} onChange={set("payment_method")} className={inp}>
          {["bkash", "nagad", "rocket", "upay", "cash", "other"].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input placeholder="TrxID" value={f.transaction_id} onChange={set("transaction_id")} className={inp} />
      </div>
      <button disabled={busy ==="manual"} className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
        {busy === "manual" ? "…" : "Pending অর্ডার তৈরি করুন"}
      </button>
    </form>
  );
}

function OrdersTab({
  rows,
  busy,
  onApprove,
  onDeleteOrder,
  plans,
  onCreate,
}: {
  rows: any[];
  busy: string | null;
  onApprove: (row: any) => Promise<void>;
  onDeleteOrder?: (row: any) => Promise<void>;
  plans?: { key: string; label: string }[];
  onCreate?: (v: any) => Promise<boolean>;
}) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const view = needle ? rows.filter((r) => [r.email, r.customer_name, r.transaction_id, r.license_key].some((v) => String(v ?? "").toLowerCase().includes(needle))) : rows;
  const pending = view.filter((r) => r.status === "pending");
  const done = view.filter((r) => r.status !== "pending");
  const paid = rows.filter((r) => r.status !== "pending");
  const revenue = paid.reduce((n, r) => n + (Number(r.amount) || 0), 0);

  const wa = (r: any) =>
    `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
      `Ghostae order\nName: ${r.customer_name ?? "-"}\nEmail: ${r.email ?? "-"}\nPlan: ${r.plan}\nAmount: ${r.amount}\nTrxID: ${r.transaction_id ?? "-"}\nLicense: ${r.license_key ?? "pending"}`,
    )}`;

  const Row = ({ r }: { r: any }) => (
    <div className={`${card} space-y-3`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{r.customer_name || r.email ||"গ্রাহক"}</p>
          <p className="truncate text-[11px] text-muted-fg">{r.email ??"—"}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
            r.status === "pending"
              ? "bg-warning/10 text-warning"
              : "bg-success/10 text-success"
          }`}
        >
          {r.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
        {[
          ["প্ল্যান", r.plan],
          ["টাকা", money(r.amount, r.currency)],
          ["মেথড", r.payment_method || r.provider || "manual"],
          ["TrxID", r.transaction_id || "—"],
        ].map(([k, v]) => (
          <div key={k as string} className="rounded-lg bg-surface-2 px-2 py-1.5">
            <p className="text-[9px] uppercase tracking-wider text-faint">{k}</p>
            <p className="truncate font-semibold">{v as string}</p>
          </div>
        ))}
      </div>
      {r.license_key && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2">
          <BadgeCheck size={14} className="shrink-0 text-success" />
          <p className="min-w-0 flex-1 truncate font-mono text-xs font-bold">{r.license_key}</p>
          <button onClick={() => navigator.clipboard?.writeText(r.license_key)} aria-label="Copy" className="text-faint">
            <Copy size={13} />
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {r.status === "pending" && (
          <button
            disabled={busy === r.id}
            onClick={() => onApprove(r)}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-primary-hover disabled:opacity-50"
          >
            {busy === r.id ? "…" : "Approve & Issue license"}
          </button>
        )}
        <a
          href={wa(r)}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-success/40 px-4 py-2 text-xs font-bold text-success"
        >
          Send to WhatsApp
        </a>
        {onDeleteOrder && (
          <button
            disabled={busy === r.id}
            onClick={() => onDeleteOrder(r)}
            className="flex items-center gap-1.5 rounded-xl border border-danger/30 px-3 py-2 text-xs font-bold text-danger transition hover:bg-danger/10 disabled:opacity-50"
          >
            <Trash2 size={13} /> {r.license_key ? "অর্ডার + License ডিলিট" : "ডিলিট"}
          </button>
        )}
        <span className="ml-auto self-center text-[10px] text-faint">{when(r.created_at)}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {onCreate && <ManualOrderForm plans={plans ?? []} busy={busy} onCreate={onCreate} />}
      <div className="grid grid-cols-3 gap-2">
        {[["মোট অর্ডার", rows.length], ["Pending", rows.length - paid.length], ["মোট আয়", money(revenue)]].map(([k, v]) => (
          <div key={k as string} className={`${card} !p-3`}>
            <p className="text-[10px] uppercase tracking-wider text-faint">{k}</p>
            <p className="text-lg font-bold">{v as any}</p>
          </div>
        ))}
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Email, নাম, TrxID বা license দিয়ে খুঁজুন…" className={input} />
      {pending.length > 0 && <p className={`${label} text-warning`}>অপেক্ষমাণ ({pending.length})</p>}
      <p className="text-xs text-muted-fg">
        ওয়েবসাইটের অর্ডার স্বয়ংক্রিয়ভাবে আসে। ম্যানুয়াল পেমেন্ট উপরের ফর্মে যোগ করুন — Approve না করা পর্যন্ত license হবে না।
      </p>
      {pending.length === 0 && done.length === 0 && (
        <div className={card}>
          <p className="text-sm text-muted-fg">এখনো কোনো অর্ডার আসেনি।</p>
        </div>
      )}
      {pending.map((r) => (
        <div key={r.id}>{Row({ r })}</div>
      ))}
      {done.length > 0 && (
        <>
          <p className={label}>সম্পন্ন ({done.length})</p>
          {done.slice(0, 40).map((r) => (
            <div key={r.id}>{Row({ r })}</div>
          ))}
        </>
      )}
    </div>
  );
}

/* ------------------------------ Licenses ------------------------------ */

function LicensesTab({
  product,
  licenses,
  activations,
  busy,
  onIssue,
  onStatus,
  onDelete,
  onDevice,
}: {
  product: Product;
  licenses: any[];
  activations: any[];
  busy: string | null;
  onIssue: (plan: string, days: number, seats: number, qty: number, email: string, customKey?: string) => Promise<string[]>;
  onStatus: (id: string, status: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDevice: (id: string, revoked: boolean) => Promise<void>;
}) {
  const [choice, setChoice] = useState(product.planChoices[0]?.key ?? "free");
  const [email, setEmail] = useState("");
  const [seats, setSeats] = useState(2);
  const [qty, setQty] = useState(1);
  const [customKey, setCustomKey] = useState("");
  const [created, setCreated] = useState<string[]>([]);

  const [expand, setExpand] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const picked = product.planChoices.find((c) => c.key === choice);
  const list = licenses.filter(
    (l) =>
      !q ||
      `${l.license_key} ${l.email ?? ""}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      <div className={`${card} space-y-3`}>
        <p className="flex items-center gap-2 text-sm font-bold">
          <Key size={15} className="text-primary" /> লাইসেন্স তৈরি করুন
        </p>
        <div className="grid gap-3 sm:grid-cols-4">
          <label className={label}>
            প্ল্যান
            <select value={choice} onChange={(e) => setChoice(e.target.value)} className={`mt-1 ${input}`}>
              {product.planChoices.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className={label}>
            ইমেইল (ঐচ্ছিক)
            <input value={email} onChange={(e) => setEmail(e.target.value)} className={`mt-1 ${input}`} placeholder="user@mail.com" />
          </label>
          <label className={label}>
            ডিভাইস
            <input type="number" min={1} max={25} value={seats} onChange={(e) => setSeats(Number(e.target.value) || 1)} className={`mt-1 ${input}`} />
          </label>
          <label className={label}>
            সংখ্যা
            <input type="number" min={1} max={50} value={qty} onChange={(e) => setQty(Number(e.target.value) || 1)} className={`mt-1 ${input}`} />
          </label>
        </div>
        <label className={label}>
          নির্দিষ্ট কী (ঐচ্ছিক — নিজে দেওয়া কী সেভ করতে)
          <input
            value={customKey}
            onChange={(e) => setCustomKey(e.target.value.toUpperCase())}
            className={`mt-1 ${input} font-mono`}
            placeholder="GHOST-XXXX-XXXX-XXXX-XXXX"
          />
        </label>
        <button
          disabled={busy === "issue"}
          onClick={async () => {
            const keys = await onIssue(choice, picked?.days ?? 0, seats, customKey.trim() ? 1 : qty, email, customKey.trim());
            setCreated(keys);
            if (keys.length) setCustomKey("");
          }}
          className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
        >
          {busy === "issue" ? "…" : customKey.trim() ? "এই কী সেভ করুন" : "কী তৈরি করুন"}
        </button>

        {created.map((k) => (
          <div key={k} className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 px-3 py-2">
            <p className="min-w-0 flex-1 truncate font-mono text-sm font-bold">{k}</p>
            <button onClick={() => navigator.clipboard?.writeText(k)} aria-label="Copy" className="text-faint">
              <Copy size={14} />
            </button>
          </div>
        ))}
      </div>

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="কী বা ইমেইল খুঁজুন" className={input} />

      {list.slice(0, 60).map((l) => {
        const devices = activations.filter((a) => a.license_id === l.id);
        return (
          <div key={l.id} className={`${card} space-y-2`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-bold">{l.license_key}</p>
                <p className="truncate text-[11px] text-muted-fg">
                  {l.email ?? "—"} · {l.plan} · {devices.filter((d) => !d.revoked).length}/{l.max_activations} ডিভাইস ·{" "}
                  {l.expires_at ? `শেষ ${when(l.expires_at)}` : "কখনো শেষ হবে না"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onStatus(l.id, l.status === "active" ? "revoked" : "active")}
                  className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                    l.status === "active" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                  }`}
                >
                  {l.status}
                </button>
                <button onClick={() => setExpand(expand === l.id ? null : l.id)} className="text-faint" aria-label="Devices">
                  <Laptop size={15} />
                </button>
                <button onClick={() => onDelete(l.id)} className="text-danger" aria-label="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {expand === l.id && (
              <div className="space-y-1.5 border-t border-line pt-2">
                {devices.length === 0 && <p className="text-[11px] text-faint">কোনো ডিভাইস নেই।</p>}
                {devices.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="min-w-0 truncate">
                      {d.hostname || d.device_fingerprint?.slice(0, 12)} · {d.platform ?? "—"} · {when(d.last_seen_at)}
                    </span>
                    <button
                      onClick={() => onDevice(d.id, !d.revoked)}
                      className={`shrink-0 rounded-full px-2 py-0.5 font-bold ${
                        d.revoked ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
                      }`}
                    >
                      {d.revoked ? "blocked" : "active"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------- Coupons ------------------------------ */

function CouponsTab({
  product,
  coupons,
  busy,
  onSave,
  onToggle,
  onPublic,
  onDelete,
}: {
  product: Product;
  coupons: any[];
  busy: string | null;
  onSave: (form: { coupon_code: string; percent_off: number; flat_off: number; max_redemptions: number; expires_in_days: number }) => Promise<void>;
  onToggle: (id: string, active: boolean) => Promise<void>;
  onPublic: (id: string, isPublic: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [form, setForm] = useState({ coupon_code: "", percent_off: 20, flat_off: 0, max_redemptions: 0, expires_in_days: 0 });

  return (
    <div className="space-y-3">
      <div className={`${card} space-y-3`}>
        <p className="flex items-center gap-2 text-sm font-bold">
          <Ticket size={15} className="text-primary" /> {product.name}-এর কুপন
        </p>
        <p className="text-[11px] text-muted-fg">
          এখানে বানানো কুপন শুধু এই প্রোডাক্টের চেকআউটেই কাজ করবে — অন্য প্রোডাক্টে নয়।
        </p>
        <div className="grid gap-3 sm:grid-cols-5">
          <label className={label}>
            কোড
            <input value={form.coupon_code} onChange={(e) => setForm({ ...form, coupon_code: e.target.value.toUpperCase() })} className={`mt-1 ${input}`} placeholder="GHOST40" />
          </label>
          <label className={label}>
            % ছাড়
            <input type="number" value={form.percent_off} onChange={(e) => setForm({ ...form, percent_off: Number(e.target.value) || 0 })} className={`mt-1 ${input}`} />
          </label>
          <label className={label}>
            ফ্ল্যাট ছাড় (৳)
            <input type="number" value={form.flat_off} onChange={(e) => setForm({ ...form, flat_off: Number(e.target.value) || 0 })} className={`mt-1 ${input}`} />
          </label>
          <label className={label}>
            সর্বোচ্চ ব্যবহার (০=সীমাহীন)
            <input type="number" value={form.max_redemptions} onChange={(e) => setForm({ ...form, max_redemptions: Number(e.target.value) || 0 })} className={`mt-1 ${input}`} />
          </label>
          <label className={label}>
            মেয়াদ (দিন)
            <input type="number" value={form.expires_in_days} onChange={(e) => setForm({ ...form, expires_in_days: Number(e.target.value) || 0 })} className={`mt-1 ${input}`} />
          </label>
        </div>
        <button
          disabled={busy === "coupon" || form.coupon_code.trim().length < 3}
          onClick={() => onSave(form)}
          className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
        >
          {busy === "coupon" ? "…" : "কুপন যোগ করুন"}
        </button>
      </div>

      {coupons.length === 0 && (
        <div className={card}>
          <p className="text-sm text-muted-fg">এই প্রোডাক্টে এখনো কোনো কুপন নেই।</p>
        </div>
      )}
      {coupons.map((c) => (
        <div key={c.id} className={`${card} flex flex-wrap items-center justify-between gap-3`}>
          <div className="min-w-0">
            <p className="truncate font-mono text-sm font-bold">{c.code}</p>
            <p className="truncate text-[11px] text-muted-fg">
              {c.percent_off ? `${c.percent_off}%` : ""} {c.flat_off ? `৳${c.flat_off}` : ""} · ব্যবহার {c.redeemed_count}
              {c.max_redemptions ? `/${c.max_redemptions}` : ""} · {c.expires_at ? when(c.expires_at) : "মেয়াদহীন"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-foreground">
              <Checkbox checked={Boolean(c.is_public)} disabled={busy === c.id} onCheckedChange={checked => void onPublic(c.id, checked === true)} aria-label={`${c.code} Public`} /> Public
            </label>
            <button
              onClick={() => onToggle(c.id, !c.active)}
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                c.active ? "bg-success/10 text-success" : "bg-faint/10 text-muted-fg"
              }`}
            >
              {c.active ? "active" : "off"}
            </button>
            <button onClick={() => onDelete(c.id)} className="text-danger" aria-label="Delete">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------- Update ------------------------------ */

function UpdateTab({
  adminCode,
  gateGet,
  gateSet,
}: {
  adminCode: string;
  gateGet: (arg: any) => Promise<any>;
  gateSet: (arg: any) => Promise<any>;
}) {
  const [gate, setGate] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setGate(await gateGet({ data: { code: adminCode } }));
    } catch {
      /* ignore */
    }
  }, [gateGet, adminCode]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (patch: any) => {
    const next = { ...(gate ?? { enabled: false, blocked: true, version: "", url: "", message: "" }), ...patch };
    setGate(next);
    setBusy(true);
    try {
      await gateSet({
        data: {
          code: adminCode,
          enabled: next.enabled,
          blocked: next.blocked,
          version: next.version,
          url: next.url,
          message: next.message,
        },
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${card} space-y-3`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-bold">
            <Package size={15} className="text-primary" /> আপডেট নোটিস
          </p>
          <p className="mt-0.5 text-[11px] text-muted-fg">
            ON করলে প্যানেলের ভিতরে নোটিস দেখাবে। Force update চালু থাকলে আপডেট ছাড়া প্যানেল চলবে না।
          </p>
        </div>
        <button
          disabled={busy}
          onClick={() => save({ enabled: !(gate?.enabled ?? false) })}
          className={`rounded-full px-4 py-2 text-xs font-bold text-white ${gate?.enabled ?"bg-success" :"bg-faint"}`}
        >
          {busy ? "…" : gate?.enabled ? "ON — live" : "OFF"}
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>
          নতুন ভার্সন
          <input value={gate?.version ??""} onChange={(e) => setGate({ ...gate, version: e.target.value })} onBlur={() => save({})} className={`mt-1 ${input}`} placeholder="3.41.0" />
        </label>
        <label className={label}>
          ডাউনলোড লিংক
          <input value={gate?.url ??""} onChange={(e) => setGate({ ...gate, url: e.target.value })} onBlur={() => save({})} className={`mt-1 ${input}`} placeholder="https://ghostae.com/downloads/..." />
        </label>
        <label className={`${label} sm:col-span-2`}>
          মেসেজ
          <textarea rows={2} value={gate?.message ??""} onChange={(e) => setGate({ ...gate, message: e.target.value })} onBlur={() => save({})} className={`mt-1 ${input}`} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-xs font-semibold text-muted-fg">
        <input type="checkbox" checked={gate?.blocked ?? true} onChange={(e) => save({ blocked: e.target.checked })} />
        Force update — আপডেট ছাড়া প্যানেল লক থাকবে
      </label>
    </div>
  );
}
