import {act,fireEvent,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach,describe,expect,it,vi} from 'vitest';
import RecipeCreatePage from '@/pages/recipes/recipe-create-page';
import RecipeDetailPage from '@/pages/recipes/recipe-detail-page';
import {recipeService} from '@/features/recipes/services/recipe-service';
import {modifierService} from '@/features/recipes/services/modifier-service';
import {mockPageServices,resetSession} from '../support/page-services';
import {mockPopulatedPages,populatedProduct} from '../support/populated-pages';
import {renderPage} from '../support/render';
import {useAuthStore} from '@/store/use-auth-store';
beforeEach(()=>{sessionStorage.clear();resetSession();mockPageServices();mockPopulatedPages();vi.spyOn(recipeService,'createProduct').mockResolvedValue(populatedProduct());vi.spyOn(recipeService,'updateProduct').mockResolvedValue(populatedProduct());});
const change=(element:HTMLElement,value:string)=>fireEvent.change(element,{target:{value}});
async function start(mode='MAKE_TO_STOCK', calculator=true){
 const user=userEvent.setup();renderPage(<RecipeCreatePage/>,'/production/products/new');
 await screen.findByRole('button',{name:'Lanjut'});change(screen.getByLabelText('Nama produk'),'Latte Baru');
 await user.selectOptions(screen.getByLabelText('Cara menyiapkan produk'),mode);await user.click(screen.getByRole('button',{name:'Lanjut'}));
 await screen.findByRole('button',{name:'Tambah bahan'});
 if(calculator) await user.click(screen.getByRole('button',{name:'Bantu tentukan harga'}));
 return user;
}
async function addIngredient(user:ReturnType<typeof userEvent.setup>,quantity='15'){
 await user.click(screen.getByRole('button',{name:'Tambah bahan'}));await user.selectOptions(screen.getByLabelText('Bahan 1'),'stock-1');change(screen.getByLabelText('Takaran (g)'),quantity);
}
describe('guided variant builder',()=>{
 it('requires identity and recipe before persistence',async()=>{const user=userEvent.setup();renderPage(<RecipeCreatePage/>,'/production/products/new');await user.click(screen.getByRole('button',{name:'Lanjut'}));expect(screen.getByRole('alert')).toHaveTextContent('Nama produk wajib');change(screen.getByLabelText('Nama produk'),'Latte');await user.click(screen.getByRole('button',{name:'Lanjut'}));await screen.findByRole('button',{name:'Tambah bahan'});await user.click(screen.getByRole('button',{name:'Simpan produk'}));expect(screen.getByRole('alert')).toHaveTextContent('minimal satu bahan');expect(recipeService.createProduct).not.toHaveBeenCalled();});
 it('saves a single per-unit variant and skips addons for MTS',async()=>{const user=await start();await addIngredient(user);change(screen.getByLabelText('Margin (%)'),'20');await user.click(screen.getByRole('button',{name:'Pakai hasil perhitungan'}));expect(screen.getByLabelText('Harga jual (Rp)')).not.toHaveAttribute('readonly');expect(screen.getByLabelText('Harga jual (Rp)')).toHaveValue('187,5');expect(screen.queryByText('3. Add-on & topping')).not.toBeInTheDocument();await user.click(screen.getByRole('button',{name:'Simpan produk'}));await waitFor(()=>expect(recipeService.createProduct).toHaveBeenCalledWith(expect.objectContaining({name:'Latte Baru',mode:'MAKE_TO_STOCK',modifierGroupIds:[],variants:[expect.objectContaining({variantName:'Regular',sellingPrice:187.5,targetMargin:0.2,ingredients:[{stockId:'stock-1',quantity:15,unit:'g'}]})]})));});
 it('copies a recipe into another variant without mutating the source',async()=>{const user=await start();await addIngredient(user);await user.click(screen.getByRole('button',{name:'Tambah varian'}));change(screen.getByLabelText('Nama varian'),'Large');await user.selectOptions(screen.getByLabelText('Salin bahan baku dari varian lain'),'0');change(screen.getByLabelText('Takaran (g)'),'20');await user.click(screen.getByRole('button',{name:'Regular'}));expect(screen.getByLabelText('Takaran (g)')).toHaveValue('15');await user.click(screen.getByRole('button',{name:'Simpan produk'}));await waitFor(()=>expect(recipeService.createProduct).toHaveBeenCalled());const payload=vi.mocked(recipeService.createProduct).mock.calls[0][0];expect(payload.variants.map(v=>v.ingredients[0].quantity)).toEqual([15,20]);});
 it('shows the optional assignment step only for MTO',async()=>{const user=await start('MAKE_TO_ORDER');await addIngredient(user);await user.click(screen.getByRole('button',{name:'Lanjut'}));expect(await screen.findByRole('heading',{name:'Add-on & Topping'})).toBeVisible();await user.click(screen.getByRole('button',{name:'Simpan produk'}));await waitFor(()=>expect(recipeService.createProduct).toHaveBeenCalledWith(expect.objectContaining({mode:'MAKE_TO_ORDER',modifierGroupIds:[]})));});
 it('allows editing modifier groups in step 2 and navigating from review actions',async()=>{
  const testGroup={id:'g1',name:'Extra Topping',minSelection:0,maxSelection:1,isActive:true,productCount:1,options:[{id:'o1',name:'Boba',price:4000,stockId:'stock-1',quantity:50,unit:'g',isActive:true}]};
  vi.mocked(modifierService.list).mockResolvedValue([testGroup]);
  const user=await start('MAKE_TO_ORDER');
  await addIngredient(user);
  await user.click(screen.getByRole('button',{name:'Lanjut'}));
  expect(await screen.findByRole('heading',{name:'Add-on & Topping'})).toBeVisible();

  const editBtn=screen.getByRole('button',{name:'Edit Extra Topping'});
  expect(editBtn).toBeVisible();
  await user.click(editBtn);
  const dialog=screen.getByRole('dialog');
  expect(within(dialog).getByRole('heading',{name:'Edit grup add-on'})).toBeVisible();
  await user.click(within(dialog).getByRole('button',{name:'Batal'}));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  const changeAddonBtn=screen.getByRole('button',{name:'Ubah add-on'});
  expect(changeAddonBtn).toBeVisible();
  await user.click(changeAddonBtn);
  expect(screen.getByRole('heading',{name:'Add-on & Topping'})).toBeVisible();

  const changeBasicBtn=screen.getByRole('button',{name:'Ubah info dasar'});
  expect(changeBasicBtn).toBeVisible();
  await user.click(changeBasicBtn);
  expect(screen.getByLabelText('Nama produk')).toHaveValue('Latte Baru');
 });
 it('keeps form state visible after a server error',async()=>{vi.mocked(recipeService.createProduct).mockRejectedValueOnce(new Error('Server sibuk'));const user=await start();await addIngredient(user);await user.click(screen.getByRole('button',{name:'Simpan produk'}));expect(await screen.findByRole('alert')).toHaveTextContent('Server sibuk');expect(screen.getByLabelText('Takaran (g)')).toHaveValue('15');await user.click(screen.getByRole('button',{name:'Kembali'}));expect(screen.getByLabelText('Nama produk')).toHaveValue('Latte Baru');});
});
describe('variant detail and editing',()=>{
 async function setup(){const user=userEvent.setup();renderPage(<RecipeDetailPage/>,'/production/products/product-1','/production/products/:productId');await screen.findByRole('heading',{name:'Roti Coklat',level:1});return user;}
 it('shows the selected variant recipe and batch history',async()=>{await setup();expect(screen.getByRole('heading',{name:'Bahan Baku Regular'})).toBeVisible();expect(screen.getByText(/LOT-TEST-001/)).toBeVisible();expect(within(screen.getByRole('table')).getByText('Tepung Terigu')).toBeVisible();});
 it('saves master and variant changes together',async()=>{const user=await setup();await user.click(screen.getByRole('button',{name:'Edit produk'}));change(screen.getByLabelText('Nama produk'),'Roti Baru');await user.click(screen.getByRole('button',{name:'Lanjut'}));await screen.findByRole('button',{name:'Tambah bahan'});await user.click(screen.getByRole('button',{name:'Bantu tentukan harga'}));change(screen.getByLabelText('Margin (%)'),'50');expect(screen.getByLabelText('Harga jual (Rp)')).toHaveValue('10.000');change(screen.getByLabelText('Harga jual (Rp)'),'12000');await user.click(screen.getByRole('button',{name:'Simpan produk'}));await waitFor(()=>expect(recipeService.updateProduct).toHaveBeenCalledWith('product-1',expect.objectContaining({name:'Roti Baru',variants:[expect.objectContaining({id:'variant-product-1',sellingPrice:12000})]})));});
 it('opens a new variant directly and preserves the existing recipe when saving',async()=>{
  const original=populatedProduct();
  const saved={...original,variants:[...original.variants,{...original.variants[0],id:'variant-large',variantName:'Large',isDefault:false}]};
  vi.mocked(recipeService.getProductById).mockResolvedValueOnce(original).mockResolvedValue(saved);
  vi.mocked(recipeService.updateProduct).mockResolvedValue(saved);
  const user=await setup();
  await user.click(screen.getByRole('button',{name:'Tambah varian'}));
  const name=screen.getByLabelText('Nama varian');
  expect(name).toHaveValue('Varian 2');
  expect(name).toHaveFocus();
  expect(recipeService.updateProduct).not.toHaveBeenCalled();
  change(name,'Large');
  await user.selectOptions(screen.getByLabelText('Salin bahan baku dari varian lain'),'0');
  change(screen.getByLabelText('Takaran (g)'),'150');
  await user.click(screen.getByRole('button',{name:'Simpan produk'}));
  await waitFor(()=>expect(recipeService.updateProduct).toHaveBeenCalledWith(original.id,expect.objectContaining({variants:[
   expect.objectContaining({id:original.variants[0].id,ingredients:[expect.objectContaining({quantity:100})]}),
   expect.objectContaining({variantName:'Large',isDefault:false,ingredients:[expect.objectContaining({quantity:150})]}),
  ]})));
  expect(await screen.findByRole('heading',{name:'Bahan Baku Large'})).toBeVisible();
 });
 it('allows changing variants and uses plain labels for costs and production',async()=>{
  const item=populatedProduct();
  item.variants.push({...item.variants[0],id:'large',variantName:'Large',isDefault:false,sku:'ROTI-LARGE',ingredients:[],batches:[]});
  vi.mocked(recipeService.getProductById).mockResolvedValue(item);
  const user=await setup();
  expect(screen.getByText('Biaya produksi terakhir')).toBeVisible();
  expect(screen.getByRole('heading',{name:'Riwayat produksi'})).toBeVisible();
  expect(screen.queryByText('HPP aktual terakhir')).not.toBeInTheDocument();
  await user.click(within(screen.getByRole('group',{name:'Varian produk'})).getByRole('button',{name:'Large'}));
  expect(screen.getByText(/Kode produk: ROTI-LARGE/)).toBeVisible();
  expect(screen.getByRole('heading',{name:'Bahan Baku Large'})).toBeVisible();
  expect(screen.getByText('Bahan baku belum ditambahkan')).toBeVisible();
  expect(screen.queryByText(/LOT-TEST-001/)).not.toBeInTheDocument();
 });
 it('hides product and variant editing from users with read access only',async()=>{
  useAuthStore.getState().setPermissions(['products:read']);
  await setup();
  expect(screen.queryByRole('button',{name:'Tambah varian'})).not.toBeInTheDocument();
  expect(screen.queryByRole('button',{name:'Edit produk'})).not.toBeInTheDocument();
  expect(screen.queryByRole('button',{name:'Edit harga & bahan baku'})).not.toBeInTheDocument();
 });
 it('can cancel a new variant without changing the product',async()=>{
  const user=await setup();
  await user.click(screen.getByRole('button',{name:'Tambah varian'}));
  change(screen.getByLabelText('Nama varian'),'Belum disimpan');
  await user.click(screen.getByRole('button',{name:'Batal'}));
  const dialog=screen.getByRole('dialog',{name:'Keluar dari form produk?'});
  await user.click(within(dialog).getByRole('button',{name:'Keluar dari form'}));
  expect(await screen.findByRole('heading',{name:'Bahan Baku Regular'})).toBeVisible();
  expect(screen.queryByRole('button',{name:/Belum disimpan/})).not.toBeInTheDocument();
  expect(recipeService.updateProduct).not.toHaveBeenCalled();
 });
 it('shows customer options for products made to order without production history',async()=>{
  const item=populatedProduct(true);
  item.modifierGroups=[{id:'extras',name:'Topping',minSelection:0,maxSelection:1,isActive:true,productCount:1,options:[{id:'cheese',name:'Keju',price:2000,isActive:true,stockId:null,quantity:0,unit:''}]}];
  vi.mocked(recipeService.getProductById).mockResolvedValue(item);
  await setup();
  expect(screen.getByRole('heading',{name:'Pilihan tambahan'})).toBeVisible();
  expect(screen.getByText('Keju')).toBeVisible();
  expect(screen.getByText('Opsional, maksimal 1 pilihan.')).toBeVisible();
  expect(screen.queryByRole('heading',{name:'Riwayat produksi'})).not.toBeInTheDocument();
  expect(screen.queryByText('Stok tersedia')).not.toBeInTheDocument();
 });
});

describe('product form usability', () => {
 it('saves a manually entered price without opening the calculator', async () => {
  const user=await start('MAKE_TO_STOCK',false);
  await addIngredient(user,'100');
  expect(screen.getByRole('button',{name:'Bantu tentukan harga'})).toHaveAttribute('aria-expanded','false');
  change(screen.getByLabelText('Harga jual (Rp)'),'4500');
  change(screen.getByLabelText('Takaran (g)'),'200');
  expect(screen.getByLabelText('Harga jual (Rp)')).toHaveValue('4.500');
  await user.click(screen.getByRole('button',{name:'Simpan produk'}));
  await waitFor(()=>expect(recipeService.createProduct).toHaveBeenCalledWith(expect.objectContaining({variants:[expect.objectContaining({sellingPrice:4500,targetMargin:0,ingredients:[expect.objectContaining({quantity:200})]})]})));
 });
 it('preserves saved prices when material costs refresh and saves them unchanged without accepting a suggestion',async()=>{
  const user=userEvent.setup();
  const {client}=renderPage(<RecipeDetailPage/>,'/production/products/product-1','/production/products/:productId');
  await screen.findByRole('heading',{name:'Roti Coklat',level:1});
  await user.click(screen.getByRole('button',{name:'Edit harga & bahan baku'}));
  await screen.findByRole('button',{name:'Tambah bahan'});
  expect(screen.getByLabelText('Harga jual (Rp)')).toHaveValue('10.000');
  await user.click(screen.getByRole('button',{name:'Bantu tentukan harga'}));
  act(()=>client.setQueryData(['recipe-materials','store-1'],[{id:'stock-1',name:'Tepung Terigu',baseUnit:'g',currentStock:5000,avgCostPerUnit:200}]));
  await waitFor(()=>expect(screen.getByText('Saran harga jual').nextElementSibling).toHaveTextContent('Rp 40.000'));
  expect(screen.getByLabelText('Harga jual (Rp)')).toHaveValue('10.000');
  expect(recipeService.updateProduct).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button',{name:'Simpan produk'}));
  await waitFor(()=>expect(recipeService.updateProduct).toHaveBeenCalledWith('product-1',expect.objectContaining({variants:[expect.objectContaining({sellingPrice:10000})]})));
 });
 it('previews a margin change without changing the selling price until applied', async () => {
  const user = await start();
  await addIngredient(user, '15');
  change(screen.getByLabelText('Harga jual (Rp)'), '333');
  change(screen.getByLabelText('Margin (%)'), '50');
  expect(screen.getByLabelText('Harga jual (Rp)')).toHaveValue('333');
  expect(screen.getByText('Saran harga jual').nextElementSibling).toHaveTextContent('Rp 300');
  await user.click(screen.getByRole('button', { name: 'Pakai hasil perhitungan' }));
  expect(screen.getByLabelText('Harga jual (Rp)')).toHaveValue('300');
  const estimate = within(screen.getByRole('complementary', { name: 'Estimasi varian' }));
  expect(estimate.queryByText('66,7%')).not.toBeInTheDocument();
  expect(estimate.queryByText('Margin estimasi')).not.toBeInTheDocument();
  change(screen.getByLabelText('Margin (%)'), '25');
  expect(screen.getByLabelText('Harga jual (Rp)')).toHaveValue('300');
  await user.click(screen.getByRole('button', { name: 'Pakai hasil perhitungan' }));
  expect(screen.getByLabelText('Harga jual (Rp)')).toHaveValue('200');
 });
 it('keeps the exact margin typed after clearing the initial zero', async () => {
  const user = await start(); await addIngredient(user, '50');
  const input = screen.getByLabelText('Margin (%)');
  await user.clear(input);
  expect(input).toHaveValue('');
  await user.type(input, '100');
  expect(input).toHaveValue('100');
 });
 it('replaces the initial zero when typing a margin directly', async () => {
  const user = await start(); await addIngredient(user, '50');
  const input = screen.getByLabelText('Margin (%)');
  expect(input).toHaveValue('');
  expect(input).toHaveAttribute('placeholder', '0');
  await user.click(input);
  await user.keyboard('100');
  expect(input).toHaveValue('100');
 });
 it('keeps decimal margin typing and replacement free of added zeros', async () => {
  const user = await start(); await addIngredient(user, '50');
  const input = screen.getByLabelText('Margin (%)');
  await user.type(input, '10');
  expect(input).toHaveValue('10');
  await user.clear(input);
  await user.type(input, '0,50');
  expect(input).toHaveValue('0,50');
  await user.clear(input);
  await user.type(input, '50');
  expect(input).toHaveValue('50');
  await user.click(screen.getByRole('button', { name: 'Pakai hasil perhitungan' }));
  expect(screen.getByLabelText('Harga jual (Rp)')).toHaveValue('1.000');
 });
 it('applies suggestions to the selected variant and keeps other prices unchanged', async () => {
  const user = await start(); await addIngredient(user, '100');
  expect(screen.getByLabelText('Harga jual (Rp)')).toHaveValue('0');
  change(screen.getByLabelText('Margin (%)'), '50');
  await user.click(screen.getByRole('button', { name: 'Pakai hasil perhitungan' }));
  expect(screen.getByLabelText('Harga jual (Rp)')).toHaveValue('2.000');
  change(screen.getByLabelText('Takaran (g)'), '150');
  expect(screen.getByLabelText('Harga jual (Rp)')).toHaveValue('2.000');
  await user.click(screen.getByRole('button', { name: 'Tambah varian' }));
  change(screen.getByLabelText('Nama varian'), 'Large');
  await user.selectOptions(screen.getByLabelText('Salin bahan baku dari varian lain'), '0');
  change(screen.getByLabelText('Margin (%)'), '75');
  await user.click(screen.getByRole('button', { name: 'Pakai hasil perhitungan' }));
  expect(screen.getByLabelText('Harga jual (Rp)')).toHaveValue('6.000');
  await user.click(screen.getByRole('button', { name: 'Regular' }));
  expect(screen.getByLabelText('Harga jual (Rp)')).toHaveValue('2.000');
  change(screen.getByLabelText('Margin (%)'), '50');
  await user.click(screen.getByRole('button', { name: 'Pakai hasil perhitungan' }));
  await user.click(screen.getByRole('button', { name: 'Simpan produk' }));
  await waitFor(() => expect(recipeService.createProduct).toHaveBeenCalledWith(expect.objectContaining({ variants: [expect.objectContaining({ sellingPrice: 3000, targetMargin: 0.5 }), expect.objectContaining({ sellingPrice: 6000, targetMargin: 0.75 })] })));
 });
 it('focuses and describes the invalid field without losing the recipe', async () => {
  const user = await start(); await addIngredient(user);
  const quantity = screen.getByLabelText('Takaran (g)'); change(quantity, '0');
  await user.click(screen.getByRole('button', { name: 'Simpan produk' }));
  expect(quantity).toHaveAttribute('aria-invalid', 'true');
  expect(quantity).toHaveAccessibleDescription('Takaran harus lebih dari nol.');
  expect(quantity).toHaveFocus(); expect(recipeService.createProduct).not.toHaveBeenCalled();
 });
 it('rejects targets of 100 percent and above and calculates valid margins', async () => {
  const user = await start(); await addIngredient(user, '50');
  const input = screen.getByLabelText('Margin (%)');
  await user.type(input, '100');
  expect(input).toHaveValue('100');
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByRole('button', { name: 'Pakai hasil perhitungan' })).toBeDisabled();
  await user.clear(input);
  await user.type(input, '50');
  expect(input).toHaveValue('50');
  expect(input).toHaveAttribute('aria-invalid', 'false');
  await user.click(screen.getByRole('button', { name: 'Pakai hasil perhitungan' }));
  expect(screen.getByLabelText('Harga jual (Rp)')).toHaveValue('1.000');
  await user.click(screen.getByRole('button', { name: 'Simpan produk' }));
  await waitFor(() => expect(recipeService.createProduct).toHaveBeenCalledWith(expect.objectContaining({ variants: [expect.objectContaining({ sellingPrice: 1000, targetMargin: 0.5 })] })));
 });
 it('formats prices and decimal quantities while sending numeric values', async () => {
  const user = await start(); await addIngredient(user, '0,125');
  change(screen.getByLabelText('Margin (%)'), '50');
  await user.click(screen.getByRole('button', { name: 'Pakai hasil perhitungan' }));
  expect(screen.getByLabelText('Harga jual (Rp)')).toHaveValue('2,5');
  await user.click(screen.getByRole('button', { name: 'Simpan produk' }));
  await waitFor(() => expect(recipeService.createProduct).toHaveBeenCalledWith(expect.objectContaining({ variants: [expect.objectContaining({ sellingPrice: 2.5, ingredients: [expect.objectContaining({ quantity: 0.125 })] })] })));
 });
 it('restores a create draft after leaving and reopening the form', async () => {
  const first = renderPage(<RecipeCreatePage />, '/production/products/new');
  change(screen.getByLabelText('Nama produk'), 'Draft Latte'); first.unmount();
  renderPage(<RecipeCreatePage />, '/production/products/new');
  expect(screen.getByLabelText('Nama produk')).toHaveValue('Draft Latte');
  expect(screen.getByText(/Draft produk dipulihkan/)).toBeVisible();
 });
 it('allows revisiting a completed step and shows a summary before saving', async () => {
  const user = await start(); await addIngredient(user);
  expect(screen.getByRole('heading', { name: 'Periksa sebelum menyimpan' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Kembali' }));
  await user.click(screen.getByRole('button', { name: /Varian & bahan baku/ }));
  expect(screen.getByLabelText('Takaran (g)')).toHaveValue('15');
 });
 it('requires confirmation before replacing an existing variant recipe', async () => {
  const user = await start(); await addIngredient(user, '15');
  await user.click(screen.getByRole('button', { name: 'Tambah varian' }));
  change(screen.getByLabelText('Nama varian'), 'Large'); await addIngredient(user, '20');
  await user.selectOptions(screen.getByLabelText('Salin bahan baku dari varian lain'), '0');
  const dialog = screen.getByRole('dialog', { name: 'Ganti bahan baku Large?' });
  await user.click(within(dialog).getByRole('button', { name: 'Batal' }));
  expect(screen.getByLabelText('Takaran (g)')).toHaveValue('20');
  await user.selectOptions(screen.getByLabelText('Salin bahan baku dari varian lain'), '0');
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Ganti bahan baku' }));
  expect(screen.getByLabelText('Takaran (g)')).toHaveValue('15');
 });
 it('routes early form submission to the next step without saving an MTO product', async () => {
  const user = userEvent.setup(); renderPage(<RecipeCreatePage />, '/production/products/new');
  change(screen.getByLabelText('Nama produk'), 'Latte');
  await user.selectOptions(screen.getByLabelText('Cara menyiapkan produk'), 'MAKE_TO_ORDER');
  fireEvent.submit(screen.getByLabelText('Nama produk').closest('form')!);
  expect(await screen.findByRole('heading', { name: 'Identitas varian' })).toBeVisible();
  expect(recipeService.createProduct).not.toHaveBeenCalled();
 });
});
