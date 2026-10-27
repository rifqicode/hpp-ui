import {normalizeGroup, type ApiModifierGroup} from './modifier-service';
import apiClient from '@/lib/api-client';
import type { Product, ProductVariant, ProductVariantView, ProductSummary, CreateProductInput, UpdateProductInput, VariantInput, RawMaterialStock, ProductCategory, PresignedUploadRequest, PresignedUploadResponse, ProductEstimate, AddIngredientInput } from '../types';

type Numeric = number | string;
interface ApiIngredient { id:string; variant_id:string; stock_id:string; stock_name:string; base_unit:string; quantity:Numeric; unit_cost:Numeric; subtotal_cost:Numeric; available_stock:Numeric }
interface ApiBatch { id:string; batch_number:string; initial_quantity:Numeric; remaining_quantity:Numeric; hpp_at_production:Numeric; production_date:string; status:'active'|'depleted' }
export interface ApiVariant { id:string; product_id:string; variant_name:string; sku:string; unit:string; selling_price:Numeric; target_margin:Numeric; current_stock:Numeric; latest_hpp:Numeric; estimated_hpp:Numeric; min_stock:Numeric; is_default:boolean; is_active:boolean; ingredients?:ApiIngredient[]; batches?:ApiBatch[] }
export interface ApiProduct { id:string; store_id?:string; name:string; category:string; category_id?:string; mode:'MAKE_TO_STOCK'|'MAKE_TO_ORDER'; image_url?:string|null; description?:string; created_at:string; updated_at?:string; variants:ApiVariant[]; modifier_groups?:ApiModifierGroup[] }
export const AVAILABLE_MATERIALS: RawMaterialStock[] = [];
export function transformProductFromApi(raw:ApiProduct):Product {
 if (!Array.isArray(raw.variants)) throw new Error('Kontrak produk tidak valid: varian tidak tersedia');
 return {modifierGroups:(raw.modifier_groups??[]).map(normalizeGroup),id:raw.id,storeId:raw.store_id,name:raw.name,category:raw.category,categoryId:raw.category_id,mode:raw.mode,imageUrl:raw.image_url??null,description:raw.description??'',createdAt:raw.created_at,updatedAt:raw.updated_at,variants:raw.variants.map(v=>({
 id:v.id,productId:raw.id,variantName:v.variant_name,sku:v.sku,unit:v.unit,sellingPrice:Number(v.selling_price),targetMargin:Number(v.target_margin),currentStock:Number(v.current_stock),latestHpp:Number(v.latest_hpp),estimatedHpp:Number(v.estimated_hpp??0),minStock:Number(v.min_stock),isDefault:v.is_default,isActive:v.is_active,
 ingredients:(v.ingredients??[]).map(i=>({id:i.id,variantId:v.id,stockId:i.stock_id,stockName:i.stock_name,baseUnit:i.base_unit,quantity:Number(i.quantity),unitCost:Number(i.unit_cost),subtotalCost:Number(i.subtotal_cost),availableStock:Number(i.available_stock)})),
 batches:(v.batches??[]).map(b=>({id:b.id,batchNumber:b.batch_number,initialQuantity:Number(b.initial_quantity),remainingQuantity:Number(b.remaining_quantity),hppAtProduction:Number(b.hpp_at_production),productionDate:b.production_date,status:b.status}))
 }))};
}
export function variantViews(products:Product[]):ProductVariantView[]{
 return products.flatMap(p=>p.variants.filter(v=>v.isActive).map(v=>({...v,name:p.name+' - '+v.variantName,productName:p.name,category:p.category,mode:p.mode,imageUrl:p.imageUrl,createdAt:p.createdAt})));
}
export function variantInput(v:ProductVariant):VariantInput{return {id:v.id,variantName:v.variantName,sku:v.sku,unit:v.unit,sellingPrice:v.sellingPrice,targetMargin:v.targetMargin,minStock:v.minStock,isDefault:v.isDefault,isActive:v.isActive,ingredients:v.ingredients.map(i=>({stockId:i.stockId,quantity:i.quantity,unit:i.baseUnit}))};}
export function productInput(product: Product): CreateProductInput {
 return { name: product.name, category: product.category, categoryId: product.categoryId, mode: product.mode, description: product.description, imageUrl: product.imageUrl, variants: product.variants.map(variantInput), modifierGroupIds: product.modifierGroups.map(group => group.id) };
}
export function productPayload(data:UpdateProductInput){return {
 modifier_group_ids:data.modifierGroupIds,name:data.name,category:data.category,category_id:data.categoryId,mode:data.mode,image_url:data.imageUrl,description:data.description,
 variants:data.variants?.map(v=>({id:v.id,variant_name:v.variantName,sku:v.sku,unit:v.unit,selling_price:v.sellingPrice,target_margin:v.targetMargin,min_stock:v.minStock,is_default:v.isDefault,is_active:v.isActive,ingredients:v.ingredients.map(i=>({stock_id:i.stockId,quantity:i.quantity,unit:i.unit}))}))
};}
export const recipeService={
 getProducts:async(query?:{search?:string;category?:string;sort?:string},options?:{storeId?:string;signal?:AbortSignal}):Promise<Product[]>=>{
 const products:Product[]=[];let page=1;let totalPages:number;
 do{const res=await apiClient.get<{items:ApiProduct[];total_pages:number}>('/products',{params:{search:query?.search,category:query?.category==='All'?undefined:query?.category,sort_by:query?.sort,page,limit:100},headers:options?.storeId?{'X-Store-ID':options.storeId}:undefined,signal:options?.signal});
 if(!Array.isArray(res.data?.items))throw new Error('Daftar produk tidak valid');products.push(...res.data.items.map(transformProductFromApi));totalPages=res.data.total_pages||1;if(page<totalPages && res.data.items.length===0)throw new Error('Daftar produk tidak lengkap');page++;}while(page<=totalPages);return products;
 },
 getVariants:async():Promise<ProductVariantView[]>=>variantViews(await recipeService.getProducts()),
 getProductSummary:async():Promise<ProductSummary>=>(await apiClient.get<ProductSummary>('/products/summary')).data,
 getProductById:async(id:string):Promise<Product>=>transformProductFromApi((await apiClient.get<ApiProduct>(`/products/${id}`)).data),
 createProduct:async(data:CreateProductInput):Promise<Product>=>transformProductFromApi((await apiClient.post<ApiProduct>('/products',productPayload(data))).data),
 updateProduct:async(id:string,data:UpdateProductInput):Promise<Product>=>transformProductFromApi((await apiClient.put<ApiProduct>(`/products/${id}`,productPayload(data))).data),
 deleteProduct:async(id:string):Promise<void>=>{await apiClient.delete(`/products/${id}`);},
 addIngredient:async(id:string,data:AddIngredientInput):Promise<Product>=>transformProductFromApi((await apiClient.post<ApiProduct>(`/variants/${id}/recipe`,{stock_id:data.stockId,quantity:data.quantity})).data),
 updateIngredientQuantity:async(id:string,itemId:string,quantity:number):Promise<Product>=>transformProductFromApi((await apiClient.put<ApiProduct>(`/variants/${id}/recipe/${itemId}`,{quantity})).data),
 removeIngredient:async(id:string,itemId:string):Promise<Product>=>transformProductFromApi((await apiClient.delete<ApiProduct>(`/variants/${id}/recipe/${itemId}`)).data),
 getAvailableMaterials:async():Promise<RawMaterialStock[]>=>{
 const out:RawMaterialStock[]=[];let page=1;let pages:number;
 do{const res=await apiClient.get<{items:{id:string;name:string;base_unit:string;current_stock:Numeric;cost_per_unit:Numeric}[];total_pages:number}>('/stocks',{params:{page,limit:100}});if(!Array.isArray(res.data.items))throw new Error('Daftar bahan tidak valid');out.push(...res.data.items.map(i=>({id:i.id,name:i.name,baseUnit:i.base_unit,currentStock:Number(i.current_stock),avgCostPerUnit:Number(i.cost_per_unit??0)})));pages=res.data.total_pages||1;if(page<pages&&!res.data.items.length)throw new Error('Daftar bahan tidak lengkap');page++;}while(page<=pages);return out;
 },
 getCategories:async():Promise<ProductCategory[]> => (await apiClient.get<ProductCategory[]>('/products/categories')).data,
 createCategory:async(name:string,description?:string):Promise<ProductCategory>=>(await apiClient.post<ProductCategory>('/products/categories',{name,description:description??''})).data,
 deleteCategory:async(id:string):Promise<void>=>{await apiClient.delete(`/products/categories/${id}`);},
  getPresignedUploadUrl: async (data: PresignedUploadRequest): Promise<PresignedUploadResponse> => {
    const response = await apiClient.post<{
      upload_url?: string;
      uploadUrl?: string;
      public_url?: string;
      publicUrl?: string;
      key?: string;
    }>('/products/upload-presigned-url', {
      filename: data.filename,
      content_type: data.contentType,
      file_size: data.fileSize,
    });

    const res = response.data;
    return {
      uploadUrl: res.upload_url || res.uploadUrl || '',
      publicUrl: res.public_url || res.publicUrl || '',
      key: res.key || '',
    };
  },

  uploadProductImage: async (file: File): Promise<string> => {
    const presigned = await recipeService.getPresignedUploadUrl({
      filename: file.name,
      contentType: file.type || 'image/jpeg',
      fileSize: file.size,
    });

    if (!presigned?.uploadUrl) {
      throw new Error('Gagal mendapatkan izin upload S3 dari server');
    }

    const uploadRes = await fetch(presigned.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type || 'image/jpeg',
      },
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload gambar ke S3 gagal (HTTP ${uploadRes.status})`);
    }

    return presigned.publicUrl;
  },


 getProductEstimate:async(id:string):Promise<ProductEstimate>=>{
 const d=(await apiClient.get<{variant_id:string;product_name:string;selling_price:Numeric;target_margin:Numeric;raw_material_total:Numeric;bom_cost_per_unit:Numeric;bom_items:{stock_id:string;stock_name:string;recipe_quantity:Numeric;unit_cost:Numeric;subtotal_cost:Numeric}[];estimated_hpp:Numeric;recommended_price:Numeric;actual_margin:Numeric;actual_markup:Numeric}>(`/variants/${id}/estimate`)).data;
 return {variantId:d.variant_id,productName:d.product_name,sellingPrice:Number(d.selling_price),targetMargin:Number(d.target_margin),rawMaterialTotal:Number(d.raw_material_total),bomCostPerUnit:Number(d.bom_cost_per_unit),bomItems:d.bom_items.map(i=>({stockId:i.stock_id,stockName:i.stock_name,quantity:Number(i.recipe_quantity),unitCost:Number(i.unit_cost),subtotalCost:Number(i.subtotal_cost)})),estimatedHpp:Number(d.estimated_hpp),recommendedPrice:Number(d.recommended_price),actualMargin:Number(d.actual_margin),actualMarkup:Number(d.actual_markup)};
 }
};
