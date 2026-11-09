import { useMemo, useState } from 'react';
import { Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import type { DietType, MenuCategory, MenuItem } from '../../lib/types';
import { api, ApiError, mediaUrl } from '../../lib/api';
import { formatPrice } from '../../lib/format';
import { useAuth } from '../auth';
import { AField, ConfirmDialog, Empty, ImageUpload, LoadingRows, Modal, PageHeader, Toggle, errorText, useToast } from '../ui';
import { VegMark } from '../../components/Ornaments';
import { ErrorState } from '../../components/ui';

type ItemForm = {
  name: string; description: string; price: string; priceNote: string; imageUrl: string | null; dietType: DietType;
  isAvailable: boolean; isFeatured: boolean; isSpecial: boolean; sortOrder: string; categoryId: string;
};
type CatForm = { name: string; description: string; sortOrder: string; isActive: boolean };

export default function MenuAdmin() {
  const toast = useToast();
  const { user } = useAuth();
  const canDelete = user?.role !== 'EDITOR';
  const cats = useFetch<MenuCategory[]>('/api/admin/menu/categories');
  const items = useFetch<MenuItem[]>('/api/admin/menu/items');
  const [filterCat, setFilterCat] = useState('');
  const [q, setQ] = useState('');

  const [itemEdit, setItemEdit] = useState<MenuItem | 'new' | null>(null);
  const [itemForm, setItemForm] = useState<ItemForm | null>(null);
  const [catEdit, setCatEdit] = useState<MenuCategory | 'new' | null>(null);
  const [catForm, setCatForm] = useState<CatForm>({ name: '', description: '', sortOrder: '0', isActive: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<{ type: 'item' | 'cat'; id: string; name: string } | null>(null);
  const [busyDel, setBusyDel] = useState(false);

  const categories = cats.data ?? [];
  const list = useMemo(
    () => (items.data ?? []).filter((i) => (!filterCat || i.categoryId === filterCat) && (!q || i.name.toLowerCase().includes(q.toLowerCase()))),
    [items.data, filterCat, q],
  );
  const reloadAll = () => { cats.reload(); items.reload(); };

  const openItem = (i: MenuItem | 'new') => {
    setErrors({});
    setItemEdit(i);
    setItemForm(
      i === 'new'
        ? { name: '', description: '', price: '', priceNote: '', imageUrl: null, dietType: 'NON_VEG', isAvailable: true, isFeatured: false, isSpecial: false, sortOrder: '0', categoryId: filterCat || categories[0]?.id || '' }
        : { name: i.name, description: i.description ?? '', price: i.price?.toString() ?? '', priceNote: i.priceNote ?? '', imageUrl: i.imageUrl, dietType: i.dietType, isAvailable: i.isAvailable, isFeatured: i.isFeatured, isSpecial: i.isSpecial, sortOrder: String(i.sortOrder), categoryId: i.categoryId },
    );
  };
  const openCat = (c: MenuCategory | 'new') => {
    setErrors({});
    setCatEdit(c);
    setCatForm(c === 'new' ? { name: '', description: '', sortOrder: String(categories.length), isActive: true } : { name: c.name, description: c.description ?? '', sortOrder: String(c.sortOrder), isActive: c.isActive });
  };
  const setI = <K extends keyof ItemForm>(k: K, v: ItemForm[K]) => setItemForm((f) => (f ? { ...f, [k]: v } : f));

  async function saveItem() {
    if (!itemForm) return;
    setSaving(true);
    setErrors({});
    const payload = { ...itemForm, price: itemForm.price === '' ? null : Number(itemForm.price), sortOrder: Number(itemForm.sortOrder) || 0 };
    try {
      if (itemEdit === 'new') await api.post('/api/admin/menu/items', payload);
      else if (itemEdit) await api.put(`/api/admin/menu/items/${itemEdit.id}`, payload);
      toast('success', 'Menu item saved.');
      setItemEdit(null);
      reloadAll();
    } catch (e) {
      if (e instanceof ApiError) setErrors(e.fields);
      toast('error', errorText(e));
    } finally {
      setSaving(false);
    }
  }

  async function saveCat() {
    setSaving(true);
    setErrors({});
    const payload = { ...catForm, sortOrder: Number(catForm.sortOrder) || 0 };
    try {
      if (catEdit === 'new') await api.post('/api/admin/menu/categories', payload);
      else if (catEdit) await api.put(`/api/admin/menu/categories/${catEdit.id}`, payload);
      toast('success', 'Category saved.');
      setCatEdit(null);
      reloadAll();
    } catch (e) {
      if (e instanceof ApiError) setErrors(e.fields);
      toast('error', errorText(e));
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailable(i: MenuItem) {
    try {
      await api.patch(`/api/admin/menu/items/${i.id}/availability`, { isAvailable: !i.isAvailable });
      items.setData((list) => list?.map((x) => (x.id === i.id ? { ...x, isAvailable: !i.isAvailable } : x)) ?? null);
    } catch (e) {
      toast('error', errorText(e));
    }
  }

  async function remove() {
    if (!del) return;
    setBusyDel(true);
    try {
      await api.del(del.type === 'item' ? `/api/admin/menu/items/${del.id}` : `/api/admin/menu/categories/${del.id}`);
      toast('success', 'Deleted.');
      if (del.type === 'cat' && filterCat === del.id) setFilterCat('');
      setDel(null);
      reloadAll();
    } catch (e) {
      toast('error', errorText(e));
    } finally {
      setBusyDel(false);
    }
  }

  if (cats.error || items.error) return <ErrorState message={cats.error || items.error || ''} onRetry={reloadAll} />;

  return (
    <>
      <PageHeader
        title="Menu"
        text="Add dishes, update prices and mark items available or unavailable. Leave the price empty if it isn’t confirmed."
        actions={
          <>
            <button className="btn-outline btn-sm" onClick={() => openCat('new')}><Plus className="h-4 w-4" /> Category</button>
            <button className="btn-ink btn-sm" onClick={() => openItem('new')} disabled={!categories.length}><Plus className="h-4 w-4" /> Menu item</button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="card h-fit overflow-hidden">
          <p className="border-b border-ink-900/10 px-5 py-3 text-xs font-medium uppercase tracking-[0.15em] text-charcoal-400">Categories</p>
          <ul className="p-2">
            <li>
              <button onClick={() => setFilterCat('')} className={`w-full rounded-lg px-3 py-2 text-left text-sm ${!filterCat ? 'bg-ink-50 text-ink-700' : 'hover:bg-cream-200'}`}>
                All items <span className="text-charcoal-300">({items.data?.length ?? 0})</span>
              </button>
            </li>
            {categories.map((c) => (
              <li key={c.id} className="group flex items-center">
                <button onClick={() => setFilterCat(c.id)} className={`flex-1 rounded-lg px-3 py-2 text-left text-sm ${filterCat === c.id ? 'bg-ink-50 text-ink-700' : 'hover:bg-cream-200'}`}>
                  {c.name} <span className="text-charcoal-300">({c.itemCount ?? 0})</span>
                  {!c.isActive && <span className="ml-1 text-xs text-ink-400">hidden</span>}
                </button>
                <button onClick={() => openCat(c)} className="rounded p-1.5 text-charcoal-300 hover:text-ink-600" aria-label={`Edit category ${c.name}`}><Pencil className="h-3.5 w-3.5" /></button>
                {canDelete && (
                  <button onClick={() => setDel({ type: 'cat', id: c.id, name: c.name })} className="rounded p-1.5 text-charcoal-300 hover:text-ink-500" aria-label={`Delete category ${c.name}`}><Trash2 className="h-3.5 w-3.5" /></button>
                )}
              </li>
            ))}
          </ul>
        </aside>

        <section className="card overflow-hidden">
          <div className="border-b border-ink-900/10 p-4">
            <label className="relative block max-w-sm">
              <span className="sr-only">Search menu items</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-300" />
              <input className="input py-2.5 pl-10 text-sm" placeholder="Search dishes…" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
          </div>
          {items.loading && !items.data ? (
            <LoadingRows />
          ) : list.length === 0 ? (
            <Empty text={categories.length ? 'No menu items here yet.' : 'Create a category first, then add menu items.'} />
          ) : (
            <ul className="divide-y divide-ink-900/[0.07]">
              {list.map((i) => (
                <li key={i.id} className={`flex flex-wrap items-center gap-4 px-5 py-3.5 ${i.isAvailable ? '' : 'opacity-60'}`}>
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-cream-200">
                    {i.imageUrl && <img src={mediaUrl(i.imageUrl)} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-medium text-charcoal">
                      <VegMark type={i.dietType} /> {i.name}
                      {i.isFeatured && <Star className="h-3.5 w-3.5 fill-saffron-400 text-saffron-400" aria-label="Featured" />}
                    </p>
                    <p className="text-xs text-charcoal-400">{i.category?.name} · {formatPrice(i.price, i.priceNote)}</p>
                  </div>
                  <Toggle checked={i.isAvailable} onChange={() => toggleAvailable(i)} label={i.isAvailable ? 'Available' : 'Unavailable'} />
                  <div className="flex">
                    <button onClick={() => openItem(i)} className="rounded-lg p-2.5 text-charcoal-400 hover:bg-cream-200 hover:text-ink-600" aria-label={`Edit ${i.name}`}><Pencil className="h-4 w-4" /></button>
                    {canDelete && (
                      <button onClick={() => setDel({ type: 'item', id: i.id, name: i.name })} className="rounded-lg p-2.5 text-charcoal-400 hover:bg-ink-50 hover:text-ink-500" aria-label={`Delete ${i.name}`}><Trash2 className="h-4 w-4" /></button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Modal
        open={itemEdit !== null && !!itemForm}
        onClose={() => setItemEdit(null)}
        title={itemEdit === 'new' ? 'Add menu item' : 'Edit menu item'}
        footer={<><button className="btn-outline btn-sm" onClick={() => setItemEdit(null)}>Cancel</button><button className="btn-ink btn-sm" onClick={saveItem} disabled={saving}>{saving ? 'Saving…' : 'Save item'}</button></>}
      >
        {itemForm && (
          <div className="grid gap-5 sm:grid-cols-2">
            <AField label="Dish name *" className="sm:col-span-2" error={errors.name}><input className="input" value={itemForm.name} onChange={(e) => setI('name', e.target.value)} /></AField>
            <AField label="Category *" error={errors.categoryId}>
              <select className="input" value={itemForm.categoryId} onChange={(e) => setI('categoryId', e.target.value)}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </AField>
            <AField label="Type">
              <select className="input" value={itemForm.dietType} onChange={(e) => setI('dietType', e.target.value as DietType)}>
                <option value="VEG">Vegetarian</option>
                <option value="NON_VEG">Non-vegetarian</option>
                <option value="EGG">Contains egg</option>
              </select>
            </AField>
            <AField label="Price (₹)" hint="Leave empty if not confirmed" error={errors.price}><input className="input" type="number" min={0} inputMode="numeric" value={itemForm.price} onChange={(e) => setI('price', e.target.value)} /></AField>
            <AField label="Text when no price" hint="e.g. Ask at branch, Market price" error={errors.priceNote}><input className="input" value={itemForm.priceNote} onChange={(e) => setI('priceNote', e.target.value)} /></AField>
            <AField label="Short description" className="sm:col-span-2" error={errors.description}><textarea rows={2} className="input" value={itemForm.description} onChange={(e) => setI('description', e.target.value)} /></AField>
            <div className="sm:col-span-2"><ImageUpload kind="menu" label="Dish photo (optional)" aspect="aspect-[4/3]" value={itemForm.imageUrl} onChange={(v) => setI('imageUrl', v)} /></div>
            <AField label="Sort order"><input className="input" type="number" value={itemForm.sortOrder} onChange={(e) => setI('sortOrder', e.target.value)} /></AField>
            <div className="grid gap-4 rounded-xl bg-cream-100 p-4 sm:col-span-2 sm:grid-cols-3">
              <Toggle checked={itemForm.isAvailable} onChange={(v) => setI('isAvailable', v)} label="Available" />
              <Toggle checked={itemForm.isFeatured} onChange={(v) => setI('isFeatured', v)} label="Featured" hint="Shown on homepage" />
              <Toggle checked={itemForm.isSpecial} onChange={(v) => setI('isSpecial', v)} label="Special label" hint="Only if confirmed" />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={catEdit !== null}
        onClose={() => setCatEdit(null)}
        title={catEdit === 'new' ? 'Add category' : 'Edit category'}
        size="max-w-lg"
        footer={<><button className="btn-outline btn-sm" onClick={() => setCatEdit(null)}>Cancel</button><button className="btn-ink btn-sm" onClick={saveCat} disabled={saving}>{saving ? 'Saving…' : 'Save category'}</button></>}
      >
        <div className="grid gap-5">
          <AField label="Category name *" error={errors.name}><input className="input" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} /></AField>
          <AField label="Description" error={errors.description}><input className="input" value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} /></AField>
          <AField label="Sort order"><input className="input" type="number" value={catForm.sortOrder} onChange={(e) => setCatForm({ ...catForm, sortOrder: e.target.value })} /></AField>
          <Toggle checked={catForm.isActive} onChange={(v) => setCatForm({ ...catForm, isActive: v })} label="Show on website" />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!del}
        title={del?.type === 'cat' ? 'Delete category?' : 'Delete menu item?'}
        text={del?.type === 'cat' ? `“${del?.name}” and ALL dishes inside it will be permanently deleted.` : `“${del?.name}” will be permanently deleted. To hide it temporarily, mark it unavailable instead.`}
        onClose={() => setDel(null)}
        onConfirm={remove}
        busy={busyDel}
      />
    </>
  );
}
