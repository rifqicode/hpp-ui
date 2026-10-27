import {screen,within,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach,describe,expect,it,vi} from 'vitest';
import PosPage from '@/pages/sales/pos-page';
import {recipeService} from '@/features/recipes/services/recipe-service';
import {salesService} from '@/features/sales/services/sales-service';
import {mockPageServices,resetSession} from '../support/page-services';
import {product} from '../support/fixtures';
import {sale} from '../support/populated-pages';
import {renderPage} from '../support/render';
import type {ModifierGroup} from '@/features/recipes/types';
const group:ModifierGroup={id:'g1',name:'Topping',minSelection:1,maxSelection:1,isActive:true,productCount:1,options:[{id:'o1',name:'Boba',price:4000,quantity:50,unit:'g',stockId:'stock-1',isActive:true},{id:'o2',name:'Jelly',price:5000,quantity:40,unit:'g',stockId:'stock-1',isActive:true}]};
beforeEach(()=>{resetSession();mockPageServices();vi.spyOn(salesService,'createSale').mockResolvedValue(sale);});
describe('variant POS configurations',()=>{
 it('enforces group limits, merges identical configurations and separates different options',async()=>{
  vi.mocked(recipeService.getProducts).mockResolvedValue([product({mode:'MAKE_TO_ORDER',modifierGroups:[group],currentStock:0})]);const user=userEvent.setup();renderPage(<PosPage/>,'/sales/pos');
  const card=(await screen.findByRole('heading',{name:'Roti Coklat'})).closest('[data-slot="card"]') as HTMLElement;
  await user.click(within(card).getByRole('button',{name:'Pilih Produk'}));let dialog=screen.getByRole('dialog');expect(within(dialog).getByRole('button',{name:'Tambah ke pesanan'})).toBeDisabled();await user.click(within(dialog).getByRole('checkbox',{name:/Boba/}));expect(within(dialog).getByRole('checkbox',{name:/Jelly/})).toBeDisabled();await user.click(within(dialog).getByRole('button',{name:'Tambah ke pesanan'}));
  await user.click(within(card).getByRole('button',{name:'Tambah Lagi'}));dialog=screen.getByRole('dialog');await user.click(within(dialog).getByRole('checkbox',{name:/Boba/}));await user.click(within(dialog).getByRole('button',{name:'Tambah ke pesanan'}));expect(screen.getAllByTitle('Hapus item')).toHaveLength(1);
  await user.click(within(card).getByRole('button',{name:'Tambah Lagi'}));dialog=screen.getByRole('dialog');await user.click(within(dialog).getByRole('checkbox',{name:/Jelly/}));await user.click(within(dialog).getByRole('button',{name:'Tambah ke pesanan'}));expect(screen.getAllByTitle('Hapus item')).toHaveLength(2);
  await user.click(screen.getByRole('button',{name:/^Bayar/}));await user.click(screen.getByRole('button',{name:'Selesaikan Transaksi'}));await waitFor(()=>expect(salesService.createSale).toHaveBeenCalled());expect(vi.mocked(salesService.createSale).mock.calls[0][0].items).toEqual([expect.objectContaining({variantId:'variant-product-1',modifierOptionIds:['o1'],quantity:2}),expect.objectContaining({variantId:'variant-product-1',modifierOptionIds:['o2'],quantity:1})]);
 });
 it('does not offer modifiers for MTS even if a stale catalog contains them',async()=>{
  vi.mocked(recipeService.getProducts).mockResolvedValue([product({mode:'MAKE_TO_STOCK',modifierGroups:[group]})]);const user=userEvent.setup();renderPage(<PosPage/>,'/sales/pos');const card=(await screen.findByRole('heading',{name:'Roti Coklat'})).closest('[data-slot="card"]') as HTMLElement;await user.click(within(card).getByRole('button',{name:'Pilih Produk'}));expect(screen.queryByRole('dialog')).not.toBeInTheDocument();expect(screen.getAllByTitle('Hapus item')).toHaveLength(1);expect(screen.queryByText('Boba')).not.toBeInTheDocument();
 });
});
