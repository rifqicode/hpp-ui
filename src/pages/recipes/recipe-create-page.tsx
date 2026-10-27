import { ProductBuilder } from '@/features/recipes/components/product-builder';
import { usePermission } from '@/hooks/use-permission';
import { useAuthStore } from '@/store/use-auth-store';
export default function RecipeCreatePage() {
 const { can } = usePermission();
 const storeId = useAuthStore(s => s.activeStoreId);
 const userId = useAuthStore(s => s.user?.id);
 if (!can('products:write')) return <p role="alert">Anda tidak memiliki akses menambah produk.</p>;
 return <ProductBuilder key={`${userId}:${storeId}`} />;
}
