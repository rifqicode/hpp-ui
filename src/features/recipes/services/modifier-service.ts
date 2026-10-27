import apiClient from '@/lib/api-client';
import type { ModifierGroup, ModifierGroupInput } from '../types';
export interface ApiModifierGroup {
 id:string; name:string; min_selection:number; max_selection:number; is_active:boolean; product_count?:number;
 options:{id:string;name:string;price:string|number;stock_id:string|null;quantity:string|number;unit:string;is_active:boolean}[];
}
export function normalizeGroup(g:ApiModifierGroup):ModifierGroup{return {id:g.id,name:g.name,minSelection:g.min_selection,maxSelection:g.max_selection,isActive:g.is_active,productCount:g.product_count??0,options:(g.options??[]).map(o=>({id:o.id,name:o.name,price:Number(o.price),stockId:o.stock_id,quantity:Number(o.quantity),unit:o.unit,isActive:o.is_active}))};}
export const modifierService={
 list:async():Promise<ModifierGroup[]> => (await apiClient.get<ApiModifierGroup[]>('/modifier-groups')).data.map(normalizeGroup),
 save:async(input:ModifierGroupInput,id?:string):Promise<ModifierGroup>=>{
 const payload={name:input.name,min_selection:input.minSelection,max_selection:input.maxSelection,is_active:input.isActive,options:input.options.map(o=>({id:o.id,name:o.name,price:o.price,stock_id:o.stockId,quantity:o.quantity,unit:o.unit,is_active:o.isActive}))};
 const response=id?await apiClient.put<ApiModifierGroup>(`/modifier-groups/${id}`,payload):await apiClient.post<ApiModifierGroup>('/modifier-groups',payload);return normalizeGroup(response.data);
 },
 archive:async(id:string):Promise<void>=>{await apiClient.delete(`/modifier-groups/${id}`);},
 forProduct:async(id:string):Promise<ModifierGroup[]> => (await apiClient.get<ApiModifierGroup[]>(`/products/${id}/modifier-groups`)).data.map(normalizeGroup),
};
