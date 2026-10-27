import {screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach,describe,expect,it,vi} from 'vitest';
import {ModifierHub} from '@/features/recipes/components/modifier-hub';
import {modifierService} from '@/features/recipes/services/modifier-service';
import type {ModifierGroup} from '@/features/recipes/types';
import {renderPage} from '../support/render';
import {mockPageServices,resetSession} from '../support/page-services';
const group:ModifierGroup={id:'g1',name:'Extra Topping',minSelection:0,maxSelection:1,isActive:true,productCount:1,options:[{id:'o1',name:'Boba',price:4000,stockId:'stock-1',quantity:50,unit:'g',isActive:true}]};
beforeEach(()=>{resetSession();mockPageServices();});
describe('modifier hub',()=>{
 it('creates a reusable group with price and per-unit ingredient quantity',async()=>{
  vi.mocked(modifierService.list).mockResolvedValueOnce([]).mockResolvedValue([group]);vi.spyOn(modifierService,'save').mockResolvedValue(group);
  const user=userEvent.setup();renderPage(<ModifierHub/>);await user.click(screen.getByRole('button',{name:'Buat grup add-on'}));
  const dialog=screen.getByRole('dialog');await user.type(within(dialog).getByLabelText('Nama grup'),'Extra Topping');await user.type(within(dialog).getByLabelText('Nama opsi'),'Boba');
  const price=within(dialog).getByLabelText('Harga tambahan (Rp)');await user.clear(price);await user.type(price,'4000');
  await user.selectOptions(within(dialog).getByRole('combobox',{name:'Bahan tambahan'}),'stock-1');const quantity=within(dialog).getByLabelText('Takaran per unit produk (g)');await user.clear(quantity);await user.type(quantity,'50');
  await user.click(within(dialog).getByRole('button',{name:'Simpan grup'}));
  await waitFor(()=>expect(modifierService.save).toHaveBeenCalledWith(expect.objectContaining({name:'Extra Topping',minSelection:0,maxSelection:1,options:[expect.objectContaining({name:'Boba',price:4000,quantity:50,stockId:'stock-1',unit:'g'})]}),undefined));
  expect(await screen.findByRole('heading',{name:'Extra Topping'})).toBeVisible();
 });
 it('edits existing option identity and keeps entered values on failure',async()=>{
  vi.mocked(modifierService.list).mockResolvedValue([group]);vi.spyOn(modifierService,'save').mockRejectedValueOnce(new Error('Grup sedang dipakai')).mockResolvedValue(group);
  const user=userEvent.setup();renderPage(<ModifierHub/>);await user.click(await screen.findByRole('button',{name:'Edit grup'}));const dialog=screen.getByRole('dialog');const price=within(dialog).getByLabelText('Harga tambahan (Rp)');await user.clear(price);await user.type(price,'5000');await user.click(within(dialog).getByRole('button',{name:'Simpan grup'}));
  expect(await within(dialog).findByRole('alert')).toHaveTextContent('Grup sedang dipakai');expect(price).toHaveValue('5.000');await user.click(within(dialog).getByRole('button',{name:'Simpan grup'}));await waitFor(()=>expect(modifierService.save).toHaveBeenLastCalledWith(expect.objectContaining({options:[expect.objectContaining({id:'o1',price:5000})]}),'g1'));
 });
 it('requires confirmation for archive and permits retry on failure',async()=>{
  vi.mocked(modifierService.list).mockResolvedValueOnce([group]).mockResolvedValue([]);vi.spyOn(modifierService,'archive').mockRejectedValueOnce(new Error('Offline')).mockResolvedValue(undefined);
  const user=userEvent.setup();renderPage(<ModifierHub/>);await user.click(await screen.findByRole('button',{name:'Arsipkan'}));expect(modifierService.archive).not.toHaveBeenCalled();const dialog=screen.getByRole('dialog');await user.click(within(dialog).getByRole('button',{name:'Arsipkan grup'}));expect(await within(dialog).findByRole('alert')).toHaveTextContent('Offline');await user.click(within(dialog).getByRole('button',{name:'Arsipkan grup'}));await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());expect(modifierService.archive).toHaveBeenLastCalledWith('g1');
 });
});
