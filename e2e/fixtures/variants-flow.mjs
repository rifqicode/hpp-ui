export default async (page) => {
 const checks=[];
 const permissions=['menu:dashboard','menu:recipes','menu:pos','menu:production','menu:stocks','products:read','products:write','products:delete','recipes:update','orders:read','orders:create','orders:void','production:read','production:write','menu:reports'];
 const stocks=[{id:'stock-coffee',name:'Biji Kopi',base_unit:'g',current_stock:'1000',cost_per_unit:'200'},{id:'stock-milk',name:'Susu',base_unit:'ml',current_stock:'5000',cost_per_unit:'20'}];
 const group={id:'group-extra',name:'Extra Shot',min_selection:0,max_selection:1,is_active:true,product_count:1,options:[{id:'option-shot',name:'Extra Espresso',price:'5000',stock_id:'stock-coffee',quantity:'18',unit:'g',is_active:true}]};
 const ingredient={id:'recipe-coffee',variant_id:'latte-regular',stock_id:'stock-coffee',stock_name:'Biji Kopi',base_unit:'g',quantity:'15',unit_cost:'200',subtotal_cost:'3000',available_stock:'1000'};
 const variant={id:'latte-regular',product_id:'latte',variant_name:'Regular',sku:'LAT-REG',unit:'gelas',selling_price:'18000',target_margin:'0.6',min_stock:'0',current_stock:'0',latest_hpp:'6200',estimated_hpp:'6000',is_default:true,is_active:true,ingredients:[ingredient],batches:[]};
 const latte={id:'latte',store_id:'variant-store',name:'Caffe Latte',category:'Coffee',category_id:'coffee-category',mode:'MAKE_TO_ORDER',image_url:null,description:'',created_at:'2026-10-23',variants:[variant,{...variant,id:'latte-large',variant_name:'Large',sku:'LAT-LRG',selling_price:'25000',is_default:false}],modifier_groups:[group]};
 const brownie={id:'brownie',store_id:'variant-store',name:'Brownies',category:'Pastry',mode:'MAKE_TO_STOCK',image_url:null,description:'',created_at:'2026-10-23',variants:[{...variant,id:'brownie-regular',product_id:'brownie',variant_name:'Regular',sku:'BRW-REG',unit:'pcs',current_stock:'8',selling_price:'12000',ingredients:[ingredient]}],modifier_groups:[]};
 const products=[latte,brownie];let postedSale=null;let postedProduct=null;let postedCompletion=null;const productionLogs=[];
 await page.unroute('**/api/**');
 await page.route('**/api/**',async route=>{
  const request=route.request();const path=new URL(request.url()).pathname.split('/api')[1];const method=request.method();let data=[];
  if(path==='/permissions/me')data={permissions,role:'OWNER'};
  else if(path==='/stores')data=[{id:'variant-store',name:'Variant Test Store',category:'Coffee',location:'Test'}];
  else if(path==='/subscription/usage'){const q={current:2,limit:100,remaining:98,is_unlimited:false};data={tier:'MAX_GROWTH',subscription_status:'ACTIVE',is_grace_period:false,is_trial:false,quotas:{products:q,stocks:q,batches:q,staff:q,stores:q,suppliers:q,customers:q},features:{production_analytics:true,advanced_pos:true,ai_assistant:false,multi_role_customization:true}};}
  else if(path==='/products/categories')data=[{id:'coffee-category',name:'Coffee'},{id:'pastry-category',name:'Pastry'}];
  else if(path==='/modifier-groups')data=[group];
  else if(path==='/stocks')data={items:stocks,total:stocks.length,page:1,limit:100,total_pages:1};
  else if(path==='/products/summary')data={total_products:products.length,active_products:products.length,low_stock_count:0};
  else if(path==='/products' && method==='GET')data={items:products,total:products.length,page:1,limit:100,total_pages:1};
  else if(path==='/products' && method==='POST'){
   postedProduct=request.postDataJSON();data={...postedProduct,id:'created-product',store_id:'variant-store',created_at:'2026-10-23',modifier_groups:postedProduct.modifier_group_ids?.length?[group]:[],variants:postedProduct.variants.map((v,i)=>({...v,id:'created-variant-'+i,product_id:'created-product',current_stock:'0',latest_hpp:'0',estimated_hpp:'3000',ingredients:v.ingredients.map((r,n)=>({...ingredient,...r,id:'created-recipe-'+i+'-'+n,variant_id:'created-variant-'+i})),batches:[]}))};products.push(data);
  }
  else if(path?.startsWith('/production/')){
   const id=path.split('/')[2];const log=productionLogs.find(l=>l.id===id);
   if(log&&path.endsWith('/pickup')){log.status='IN_PROGRESS';data=log;}
   else if(log&&path.endsWith('/complete')){postedCompletion=request.postDataJSON();log.status='COMPLETED';log.qty_actual=postedCompletion.actual_qty;log.good_quantity=postedCompletion.actual_qty;log.waste_quantity=postedCompletion.waste_qty;log.total_cost='13200';log.bom_cost='13200';log.hpp_per_unit='13200';log.completed_at='2026-10-23T13:00:00Z';data=log;}
   else data=log;
  }
  else if(path?.startsWith('/products/'))data=products.find(p=>p.id===path.split('/')[2]);
  else if(path==='/sales'&&method==='POST'){
   postedSale=request.postDataJSON();data={id:'sale-variant',invoice_number:'TEST-VARIANT-001',customer_name:'Guest',total_amount:'41000',total_cost:'12400',gross_profit:'28600',payment_method:postedSale.payment_method,status:'IN_PROGRESS',transaction_date:'2026-10-23T12:00:00Z',items:postedSale.items.map((i,n)=>({...i,id:'sale-line-'+n,product_name:'Caffe Latte',variant_name:'Regular',unit:'gelas',price_at_sale:i.modifier_option_ids.length?'23000':'18000',cost_at_sale:'6200',subtotal:i.modifier_option_ids.length?'23000':'18000',total_cost:'6200',cost_status:'ESTIMATED',modifiers:i.modifier_option_ids.length?[{id:'sale-modifier',name:'Extra Espresso',price:'5000',cost:'0',total_cost:'0'}]:[]}))};

   for(const [n,item] of data.items.entries())productionLogs.push({id:'browser-log-'+n,store_id:'variant-store',sale_id:data.id,sale_item_id:item.id,variant_id:item.variant_id,batch_number:'BROWSER-MTO-'+n,status:'QUEUED',target_quantity:item.quantity,qty_planned:item.quantity,qty_actual:0,started_at:'2026-10-23T12:00:00Z',recipe_snapshot:{variant_id:item.variant_id,variant_name:'Regular',product_name:'Caffe Latte',product_unit:'gelas',product_category:'Coffee',selling_price:'18000',items:[{stock_id:'stock-coffee',stock_name:'Biji Kopi',quantity:'15',unit:'g',cost_per_unit:'200'}],modifiers:item.modifiers.map(m=>({...m,stock_id:'stock-coffee',ingredient_quantity:'18',unit:'g'})),overheads:[]},variant:{...variant,product:latte},consumptions:[],overheads:[]});
  }
  await route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'http://localhost:5173','access-control-allow-credentials':'true','access-control-allow-headers':'Content-Type,Authorization,X-Store-ID','access-control-allow-methods':'GET,POST,PUT,DELETE,OPTIONS'},body:JSON.stringify({success:true,data})});
 });
 await page.addInitScript(()=>{localStorage.setItem('token','variant-browser-test');localStorage.setItem('auth-storage',JSON.stringify({state:{user:{id:'variant-user',name:'Test Operator',email:'test@example.invalid',role:'OWNER',account_type:'OWNER'},token:'variant-browser-test',activeStoreId:'variant-store',activeStoreName:'Variant Test Store',permissions:[]},version:0}));});
 await page.setViewportSize({width:1365,height:900});
 await page.goto('http://localhost:5173/production/products');
 await page.getByRole('link',{name:/Caffe Latte/}).first().waitFor();checks.push('catalog masters and variant prices render');
 await page.getByRole('button',{name:'Add-on & Topping',exact:true}).click();await page.getByRole('heading',{name:'Extra Shot',exact:true}).waitFor();checks.push('modifier hub renders attached group');
 await page.goto('http://localhost:5173/production/products/new');
 await page.getByLabel('Nama produk',{exact:true}).fill('Latte Browser');await page.getByRole('combobox',{name:'Cara menyiapkan produk',exact:true}).selectOption('MAKE_TO_ORDER');await page.getByRole('button',{name:'Lanjut',exact:true}).click();
 await page.getByRole('button',{name:'Tambah bahan',exact:true}).click();await page.getByRole('combobox',{name:'Bahan 1',exact:true}).selectOption('stock-coffee');await page.getByLabel('Takaran (g)',{exact:true}).fill('15');await page.getByLabel('Harga jual (Rp)',{exact:true}).fill('18000');
 await page.getByRole('button',{name:'Tambah varian',exact:true}).click();await page.getByLabel('Nama varian',{exact:true}).fill('Large');await page.getByRole('combobox',{name:'Salin resep dari varian lain',exact:true}).selectOption('0');await page.getByLabel('Takaran (g)',{exact:true}).fill('20');await page.getByLabel('Harga jual (Rp)',{exact:true}).fill('25000');
 await page.getByRole('button',{name:'Regular',exact:true}).click();if(await page.getByLabel('Takaran (g)',{exact:true}).inputValue()!=='15')throw new Error('Copy changed source recipe');checks.push('recipe copy is independent');
 await page.getByRole('button',{name:'Lanjut',exact:true}).click();await page.getByRole('checkbox',{name:/Extra Shot/}).check();await page.getByRole('button',{name:'Simpan produk',exact:true}).click();await page.waitForURL('**/production/products/created-product');
 if(postedProduct.variants.length!==2||postedProduct.variants[1].ingredients[0].quantity!==20||postedProduct.modifier_group_ids[0]!=='group-extra')throw new Error('Product payload incorrect');checks.push('two variants and assignment saved atomically');
 await page.goto('http://localhost:5173/sales/pos');
 const card=page.getByRole('heading',{name:'Caffe Latte',exact:true}).locator('..');await card.getByRole('button',{name:'Pilih Produk',exact:true}).click();await page.getByRole('radio',{name:/Regular/}).check();await page.getByLabel(/Extra Espresso/).check();await page.getByRole('button',{name:'Tambah ke pesanan',exact:true}).click();
 await card.getByRole('button',{name:'Tambah Lagi',exact:true}).click();await page.getByRole('radio',{name:/Regular/}).check();await page.getByRole('button',{name:'Tambah ke pesanan',exact:true}).click();
 if(await page.getByTitle('Hapus item').count()!==2)throw new Error('Different configurations merged');checks.push('POS separates variant configurations');
 await page.getByRole('button',{name:/^Bayar/}).click();await page.getByRole('button',{name:'Selesaikan Transaksi',exact:true}).click();await page.getByRole('dialog',{name:'Transaksi Berhasil Disimpan!'}).waitFor();
 if(postedSale.items.length!==2||!postedSale.items.every(i=>i.variant_id==='latte-regular')||postedSale.items.filter(i=>i.modifier_option_ids.length===1).length!==1)throw new Error('Sale payload incorrect');
 await page.getByText('Extra Espresso',{exact:false}).last().waitFor();checks.push('checkout sends variant IDs and receipt keeps modifiers');
 await page.getByRole('button',{name:'Transaksi Baru',exact:true}).click();

 await page.goto('http://localhost:5173/production/batches/browser-log-0');
 await page.getByRole('button',{name:'Mulai proses',exact:true}).click();
 await page.getByRole('button',{name:'Selesaikan & Hitung HPP',exact:true}).waitFor();
 await page.getByText(/Extra Espresso.*18 g per unit/).waitFor();checks.push('MTO queue details retain addon instructions and can start processing');
 await page.getByRole('button',{name:'Selesaikan & Hitung HPP',exact:true}).click();
 await page.getByLabel('Unit Bagus',{exact:true}).fill('1');await page.getByLabel('Unit Rusak (Afkir)',{exact:true}).fill('1');
 await page.getByRole('dialog').getByRole('button',{name:'Selesaikan',exact:true}).click();
 await page.getByRole('button',{name:'Void Produksi',exact:true}).waitFor();
 if(postedCompletion.actual_qty!==1||postedCompletion.waste_qty!==1)throw new Error('Actual/waste payload incorrect');checks.push('production completion submits actual good and waste quantities');
 await page.goto('http://localhost:5173/sales/pos');await page.getByRole('heading',{name:'Brownies',exact:true}).locator('..').getByRole('button',{name:'Pilih Produk',exact:true}).click();
 if(await page.getByRole('dialog').count()!==0)throw new Error('MTS unexpectedly offers addon configuration');checks.push('MTS is sold as produced without topping configuration');
 await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:5173/production/products/new');await page.getByLabel('Nama produk',{exact:true}).waitFor();
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);if(overflow)throw new Error('Mobile overflow');checks.push('mobile builder has no horizontal overflow');
 return {checks,postedProduct,postedSale,postedCompletion};
}
