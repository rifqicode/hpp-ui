import apiClient from '@/lib/api-client';
import { normalizeStorefrontConfig } from '../lib/default-config';
import type {
  CreateOnlineOrderRequest,
  PublicCatalogProduct,
  PublicModifierGroup,
  PublicOrderTrackingItem,
  PublicOrderTrackingResponse,
  PublicProductVariant,
  PublicStorefrontResponse,
  PublicStoreProfile,
  UpdateStorefrontSettingsPayload,
} from '../types';

function normalizePublicVariant(raw: any, productId: string): PublicProductVariant {
  return {
    id: String(raw?.id || ''),
    product_id: String(raw?.product_id || raw?.productId || productId),
    variant_name: String(raw?.variant_name || raw?.variantName || 'Reguler'),
    sku: String(raw?.sku || ''),
    unit: String(raw?.unit || 'pcs'),
    selling_price: Number(raw?.selling_price ?? raw?.sellingPrice ?? 0),
    current_stock: Number(raw?.current_stock ?? raw?.currentStock ?? 0),
    is_default: Boolean(raw?.is_default ?? raw?.isDefault ?? false),
    is_active: raw?.is_active !== undefined ? Boolean(raw.is_active) : true,
  };
}

function normalizePublicModifierGroup(raw: any): PublicModifierGroup {
  return {
    id: String(raw?.id || ''),
    name: String(raw?.name || ''),
    min_selection: Number(raw?.min_selection ?? raw?.minSelection ?? 0),
    max_selection: Number(raw?.max_selection ?? raw?.maxSelection ?? 1),
    options: Array.isArray(raw?.options)
      ? raw.options.map((opt: any) => ({
          id: String(opt?.id || ''),
          name: String(opt?.name || ''),
          price: Number(opt?.price ?? 0),
        }))
      : [],
  };
}

export function normalizePublicProduct(raw: any): PublicCatalogProduct {
  const id = String(raw?.id || '');
  const variants = Array.isArray(raw?.variants)
    ? raw.variants
        .map((v: any) => normalizePublicVariant(v, id))
        .filter((v: PublicProductVariant) => v.is_active)
    : [];

  return {
    id,
    name: String(raw?.name || ''),
    category: String(
      raw?.category_model?.name || raw?.category || 'Lainnya'
    ),
    category_id: raw?.category_id || raw?.categoryId,
    mode:
      raw?.mode === 'MAKE_TO_ORDER' ? 'MAKE_TO_ORDER' : 'MAKE_TO_STOCK',
    image_url: raw?.image_url || raw?.imageUrl || null,
    description: String(raw?.description || ''),
    variants,
    modifier_groups: Array.isArray(raw?.modifier_groups || raw?.modifierGroups)
      ? (raw.modifier_groups || raw.modifierGroups).map(
          normalizePublicModifierGroup
        )
      : [],
  };
}

export function normalizePublicStoreProfile(raw: any): PublicStoreProfile {
  const name = String(raw?.name || 'Toko');
  const phone = String(raw?.phone || '');
  let parsedConfig = raw?.storefront_config ?? raw?.storefrontConfig ?? {};
  if (typeof parsedConfig === 'string') {
    try {
      parsedConfig = JSON.parse(parsedConfig);
    } catch {
      parsedConfig = {};
    }
  }

  return {
    id: String(raw?.id || ''),
    name,
    slug: String(raw?.slug || ''),
    category: String(raw?.category || ''),
    location: String(raw?.location || raw?.address || ''),
    address: String(raw?.address || raw?.location || ''),
    phone,
    description: String(raw?.description || ''),
    is_storefront_active: Boolean(
      raw?.is_storefront_active ?? raw?.isStorefrontActive ?? false
    ),
    storefront_config: normalizeStorefrontConfig(parsedConfig, name, phone),
  };
}

export function normalizePublicStorefrontResponse(
  raw: any
): PublicStorefrontResponse {
  const storeRaw = raw?.store || raw || {};
  const store = normalizePublicStoreProfile(storeRaw);
  const rawProducts = Array.isArray(raw?.products) ? raw.products : [];
  const products = rawProducts
    .map(normalizePublicProduct)
    .filter((p: PublicCatalogProduct) => p.variants.length > 0);

  const categorySet = new Set<string>();
  if (Array.isArray(raw?.categories)) {
    for (const c of raw.categories) {
      const catName = typeof c === 'string' ? c : c?.name;
      if (catName) categorySet.add(String(catName));
    }
  }
  for (const p of products) {
    if (p.category) categorySet.add(p.category);
  }

  return {
    store,
    categories: Array.from(categorySet),
    products,
  };
}

export function normalizePublicOrderTracking(
  raw: any
): PublicOrderTrackingResponse {
  const orderRaw = raw?.sale || raw?.order || raw || {};
  const storeRaw = raw?.store || orderRaw?.store || {};
  const store = normalizePublicStoreProfile(storeRaw);

  const items: PublicOrderTrackingItem[] = Array.isArray(orderRaw?.items)
    ? orderRaw.items.map((it: any) => ({
        id: String(it?.id || ''),
        variant_id: String(it?.variant_id || it?.variantId || ''),
        product_name: String(
          it?.product_name ||
            it?.productName ||
            it?.variant?.product?.name ||
            'Produk'
        ),
        variant_name: String(
          it?.variant_name ||
            it?.variantName ||
            it?.variant?.variant_name ||
            'Reguler'
        ),
        unit: String(it?.unit || it?.variant?.unit || 'pcs'),
        quantity: Number(it?.quantity ?? 0),
        price_at_sale: Number(it?.price_at_sale ?? it?.priceAtSale ?? 0),
        subtotal: Number(it?.subtotal ?? 0),
        modifiers: Array.isArray(it?.modifiers)
          ? it.modifiers.map((m: any) => ({
              id: String(m?.id || ''),
              name: String(m?.name || ''),
              price: Number(m?.price ?? 0),
            }))
          : [],
      }))
    : [];

  const totalAmount = Number(
    orderRaw?.total_amount ?? orderRaw?.totalAmount ?? 0
  );
  const deliveryFee = Number(
    orderRaw?.delivery_fee ?? orderRaw?.deliveryFee ?? 0
  );
  const discountAmount = Number(
    orderRaw?.discount_amount ?? orderRaw?.discountAmount ?? 0
  );
  const taxAmount = Number(orderRaw?.tax_amount ?? orderRaw?.taxAmount ?? 0);
  const computedSubtotal =
    items.reduce((acc, item) => acc + item.subtotal, 0) ||
    Math.max(0, totalAmount - deliveryFee - taxAmount + discountAmount);

  return {
    id: String(orderRaw?.id || ''),
    invoice_number: String(
      orderRaw?.invoice_number || orderRaw?.invoiceNumber || ''
    ),
    public_tracking_token: String(
      orderRaw?.public_tracking_token ||
        orderRaw?.publicTrackingToken ||
        raw?.public_tracking_token ||
        ''
    ),
    status: orderRaw?.status || 'PENDING_CONFIRMATION',
    order_source: String(
      orderRaw?.order_source || orderRaw?.orderSource || 'ONLINE'
    ),
    fulfillment_type:
      orderRaw?.fulfillment_type || orderRaw?.fulfillmentType || 'PICKUP',
    customer_name: String(
      orderRaw?.customer_name || orderRaw?.customerName || 'Pelanggan'
    ),
    customer_phone: String(
      orderRaw?.customer_phone || orderRaw?.customerPhone || ''
    ),
    customer_email: String(
      orderRaw?.customer_email || orderRaw?.customerEmail || ''
    ),
    table_number: String(
      orderRaw?.table_number || orderRaw?.tableNumber || ''
    ),
    delivery_address: String(
      orderRaw?.delivery_address || orderRaw?.deliveryAddress || ''
    ),
    delivery_fee: deliveryFee,
    delivery_courier_name: String(
      orderRaw?.delivery_courier_name || orderRaw?.deliveryCourierName || ''
    ),
    delivery_tracking_info: String(
      orderRaw?.delivery_tracking_info || orderRaw?.deliveryTrackingInfo || ''
    ),
    pickup_time: String(orderRaw?.pickup_time || orderRaw?.pickupTime || ''),
    custom_field_label: String(
      orderRaw?.custom_field_label || orderRaw?.customFieldLabel || ''
    ),
    custom_field_value: String(
      orderRaw?.custom_field_value || orderRaw?.customFieldValue || ''
    ),
    payment_method:
      orderRaw?.payment_method || orderRaw?.paymentMethod || 'CASH',
    payment_reference: String(
      orderRaw?.payment_reference || orderRaw?.paymentReference || ''
    ),
    notes: String(orderRaw?.notes || ''),
    rejection_reason: String(
      orderRaw?.rejection_reason || orderRaw?.rejectionReason || ''
    ),
    subtotal_amount: Number(orderRaw?.subtotal_amount ?? computedSubtotal),
    discount_amount: discountAmount,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    transaction_date: String(
      orderRaw?.transaction_date ||
        orderRaw?.transactionDate ||
        orderRaw?.created_at ||
        new Date().toISOString()
    ),
    created_at: String(
      orderRaw?.created_at ||
        orderRaw?.createdAt ||
        new Date().toISOString()
    ),
    items,
    store,
  };
}

export const storefrontService = {
  getPublicStorefront: async (
    slug: string
  ): Promise<PublicStorefrontResponse> => {
    const res = await apiClient.get<any>(
      `/public/stores/${encodeURIComponent(slug)}`,
      { skipLoading: true }
    );
    return normalizePublicStorefrontResponse(res.data);
  },

  createOnlineOrder: async (
    slug: string,
    payload: CreateOnlineOrderRequest
  ): Promise<PublicOrderTrackingResponse> => {
    const res = await apiClient.post<any>(
      `/public/stores/${encodeURIComponent(slug)}/orders`,
      payload,
      { skipLoading: true }
    );
    return normalizePublicOrderTracking(res.data);
  },

  getPublicOrderTracking: async (
    slug: string,
    token: string
  ): Promise<PublicOrderTrackingResponse> => {
    const res = await apiClient.get<any>(
      `/public/stores/${encodeURIComponent(slug)}/orders/${encodeURIComponent(token)}`,
      { skipLoading: true }
    );
    return normalizePublicOrderTracking(res.data);
  },

  checkSlugAvailability: async (
    slug: string
  ): Promise<{ available: boolean; slug: string; message?: string }> => {
    const res = await apiClient.get<any>('/store/storefront/check-slug', {
      params: { slug },
      skipLoading: true,
    });
    return {
      available: Boolean(res.data?.available ?? res.data?.is_available ?? false),
      slug: String(res.data?.slug || slug),
      message: res.data?.message,
    };
  },

  updateStorefrontSettings: async (
    payload: UpdateStorefrontSettingsPayload
  ): Promise<PublicStoreProfile> => {
    const res = await apiClient.put<any>('/store/storefront', payload);
    return normalizePublicStoreProfile(res.data);
  },

  uploadStorefrontImage: async (file: File): Promise<string> => {
    const presignedRes = await apiClient.post<{
      upload_url?: string;
      uploadUrl?: string;
      public_url?: string;
      publicUrl?: string;
    }>('/store/storefront/upload-presigned-url', {
      filename: file.name,
      content_type: file.type || 'image/jpeg',
      file_size: file.size,
    });

    const uploadUrl =
      presignedRes.data?.upload_url || presignedRes.data?.uploadUrl || '';
    const publicUrl =
      presignedRes.data?.public_url || presignedRes.data?.publicUrl || '';

    if (!uploadUrl) {
      throw new Error('Gagal mendapatkan izin unggah gambar dari server');
    }

    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type || 'image/jpeg',
      },
    });

    if (!putRes.ok) {
      throw new Error(`Gagal mengunggah gambar (HTTP ${putRes.status})`);
    }

    return publicUrl;
  },
};
