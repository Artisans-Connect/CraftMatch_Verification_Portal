import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Layers3,
  Pencil,
  Plus,
  Power,
  Save,
  X,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { adminGet, adminPatch, adminPost } from '../../lib/api';
import type { AdminCategory, AdminSubcategory } from '../../types';

interface ServiceCatalogPageProps {
  onNavigate: (page: string, data?: unknown) => void;
}

type CategoryForm = {
  name: string;
  slug: string;
  icon_name: string;
  color_hex: string;
  description: string;
  sort_order: number;
  is_active: boolean;
};

type SubcategoryForm = {
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  is_active: boolean;
};

const emptyCategory: CategoryForm = {
  name: '',
  slug: '',
  icon_name: '',
  color_hex: '#C15A3D',
  description: '',
  sort_order: 0,
  is_active: true,
};

const emptySubcategory: SubcategoryForm = {
  name: '',
  slug: '',
  description: '',
  sort_order: 0,
  is_active: true,
};

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function categoryToForm(category: AdminCategory): CategoryForm {
  return {
    name: category.name,
    slug: category.slug,
    icon_name: category.icon_name ?? '',
    color_hex: category.color_hex ?? '#C15A3D',
    description: category.description ?? '',
    sort_order: category.sort_order ?? 0,
    is_active: category.is_active,
  };
}

function subcategoryToForm(subcategory: AdminSubcategory): SubcategoryForm {
  return {
    name: subcategory.name,
    slug: subcategory.slug,
    description: subcategory.description ?? '',
    sort_order: subcategory.sort_order ?? 0,
    is_active: subcategory.is_active,
  };
}

export function ServiceCatalogPage({ onNavigate }: ServiceCatalogPageProps) {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
  const [newSubcategoryCategoryId, setNewSubcategoryCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategory);
  const [subcategoryForm, setSubcategoryForm] = useState<SubcategoryForm>(emptySubcategory);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showInactive, setShowInactive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const visibleCategories = useMemo(
    () => categories.filter((category) => showInactive || category.is_active),
    [categories, showInactive],
  );

  const loadCategories = () => {
    setLoading(true);
    adminGet<AdminCategory[]>('/admin/categories')
      .then((data) => {
        setCategories(data);
        setError('');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load catalog.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadCategories, []);

  const saveCategory = async (categoryId?: string) => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const body = {
        ...categoryForm,
        icon_name: categoryForm.icon_name || null,
        color_hex: categoryForm.color_hex || null,
        description: categoryForm.description || null,
      };
      if (categoryId) {
        await adminPatch<AdminCategory>(`/admin/categories/${categoryId}`, body);
        setEditingCategoryId(null);
        setMessage('Category updated.');
      } else {
        await adminPost<AdminCategory>('/admin/categories', body);
        setShowNewCategory(false);
        setMessage('Category created.');
      }
      loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save category.');
    } finally {
      setSaving(false);
    }
  };

  const saveSubcategory = async (categoryId?: string, subcategoryId?: string) => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const body = {
        ...subcategoryForm,
        description: subcategoryForm.description || null,
      };
      if (subcategoryId) {
        await adminPatch<AdminSubcategory>(`/admin/subcategories/${subcategoryId}`, body);
        setEditingSubcategoryId(null);
        setMessage('Subcategory updated.');
      } else if (categoryId) {
        await adminPost<AdminSubcategory>(`/admin/categories/${categoryId}/subcategories`, body);
        setNewSubcategoryCategoryId(null);
        setMessage('Subcategory created.');
      }
      loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save subcategory.');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategoryActive = (category: AdminCategory) => {
    setCategoryForm(categoryToForm({ ...category, is_active: !category.is_active }));
    setTimeout(() => {
      adminPatch<AdminCategory>(`/admin/categories/${category.id}`, { is_active: !category.is_active })
        .then(() => {
          setMessage(category.is_active ? 'Category deactivated.' : 'Category activated.');
          loadCategories();
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Could not update category.'));
    }, 0);
  };

  const toggleSubcategoryActive = (subcategory: AdminSubcategory) => {
    adminPatch<AdminSubcategory>(`/admin/subcategories/${subcategory.id}`, {
      is_active: !subcategory.is_active,
    })
      .then(() => {
        setMessage(subcategory.is_active ? 'Subcategory deactivated.' : 'Subcategory activated.');
        loadCategories();
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not update subcategory.'));
  };

  const toggleExpanded = (categoryId: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  return (
    <AdminLayout currentPage="catalog" onNavigate={onNavigate}>
      <div className="space-y-5 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Service Catalog</h2>
            <p className="text-sm text-text-muted">Manage app categories and service types.</p>
          </div>
          <div className="flex gap-2">
            <button
              className={`btn-ghost ${showInactive ? 'bg-neutral-100' : ''}`}
              onClick={() => setShowInactive((value) => !value)}
            >
              {showInactive ? 'Hide inactive' : 'Show inactive'}
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                setCategoryForm(emptyCategory);
                setShowNewCategory(true);
              }}
            >
              <Plus size={16} />
              New Category
            </button>
          </div>
        </div>

        {message && <div className="card p-3 text-sm text-success-dark bg-success-light/40">{message}</div>}
        {error && <div className="card p-3 text-sm text-error bg-error-light/40 border-error/20">{error}</div>}

        {showNewCategory && (
          <CatalogForm
            title="New category"
            form={categoryForm}
            saving={saving}
            onChange={setCategoryForm}
            onCancel={() => setShowNewCategory(false)}
            onSave={() => saveCategory()}
          />
        )}

        <div className="card overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-text-muted">Loading catalog...</div>
          ) : visibleCategories.length === 0 ? (
            <div className="py-16 text-center">
              <Layers3 size={32} className="mx-auto mb-3 text-neutral-300" />
              <p className="text-text-muted">No categories found.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {visibleCategories.map((category) => {
                const isExpanded = expanded.has(category.id);
                const isEditing = editingCategoryId === category.id;
                return (
                  <div key={category.id}>
                    <div className="p-4 flex items-center gap-3">
                      <button className="btn-ghost px-2" onClick={() => toggleExpanded(category.id)}>
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: category.color_hex ?? '#C15A3D' }}
                      >
                        {category.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-text-primary">{category.name}</p>
                          <span className={`badge ${category.is_active ? 'badge-approved' : 'badge-rejected'}`}>
                            {category.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted truncate">
                          {category.slug} · {category.subcategories?.length ?? 0} service types · order {category.sort_order}
                        </p>
                      </div>
                      <button
                        className="btn-ghost"
                        onClick={() => {
                          setEditingCategoryId(category.id);
                          setCategoryForm(categoryToForm(category));
                        }}
                      >
                        <Pencil size={16} />
                      </button>
                      <button className="btn-ghost" onClick={() => toggleCategoryActive(category)}>
                        <Power size={16} />
                      </button>
                    </div>

                    {isEditing && (
                      <div className="px-4 pb-4">
                        <CatalogForm
                          title="Edit category"
                          form={categoryForm}
                          saving={saving}
                          onChange={setCategoryForm}
                          onCancel={() => setEditingCategoryId(null)}
                          onSave={() => saveCategory(category.id)}
                        />
                      </div>
                    )}

                    {isExpanded && (
                      <div className="px-5 pb-5 ml-12 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-text-primary">Service types</p>
                          <button
                            className="btn-secondary py-2 px-3"
                            onClick={() => {
                              setNewSubcategoryCategoryId(category.id);
                              setSubcategoryForm(emptySubcategory);
                            }}
                          >
                            <Plus size={14} />
                            Add type
                          </button>
                        </div>

                        {newSubcategoryCategoryId === category.id && (
                          <SubcategoryFormView
                            title="New service type"
                            form={subcategoryForm}
                            saving={saving}
                            onChange={setSubcategoryForm}
                            onCancel={() => setNewSubcategoryCategoryId(null)}
                            onSave={() => saveSubcategory(category.id)}
                          />
                        )}

                        {(category.subcategories ?? []).map((subcategory) => (
                          <div key={subcategory.id} className="rounded-xl border border-neutral-100 bg-white p-3">
                            {editingSubcategoryId === subcategory.id ? (
                              <SubcategoryFormView
                                title="Edit service type"
                                form={subcategoryForm}
                                saving={saving}
                                onChange={setSubcategoryForm}
                                onCancel={() => setEditingSubcategoryId(null)}
                                onSave={() => saveSubcategory(undefined, subcategory.id)}
                              />
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-text-primary">{subcategory.name}</p>
                                    <span className={`badge ${subcategory.is_active ? 'badge-approved' : 'badge-rejected'}`}>
                                      {subcategory.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-text-muted">
                                    {subcategory.slug} · order {subcategory.sort_order}
                                  </p>
                                  {subcategory.description && (
                                    <p className="text-sm text-text-secondary mt-1">{subcategory.description}</p>
                                  )}
                                </div>
                                <button
                                  className="btn-ghost"
                                  onClick={() => {
                                    setEditingSubcategoryId(subcategory.id);
                                    setSubcategoryForm(subcategoryToForm(subcategory));
                                  }}
                                >
                                  <Pencil size={15} />
                                </button>
                                <button className="btn-ghost" onClick={() => toggleSubcategoryActive(subcategory)}>
                                  <Power size={15} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function CatalogForm({
  title,
  form,
  saving,
  onChange,
  onCancel,
  onSave,
}: {
  title: string;
  form: CategoryForm;
  saving: boolean;
  onChange: (form: CategoryForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-text-primary">{title}</h3>
        <button className="btn-ghost" onClick={onCancel}><X size={16} /></button>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <input className="input-field" placeholder="Name" value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} />
        <input className="input-field" placeholder="Slug" value={form.slug} onChange={(e) => onChange({ ...form, slug: slugify(e.target.value) })} />
        <input className="input-field" placeholder="Icon name" value={form.icon_name} onChange={(e) => onChange({ ...form, icon_name: e.target.value })} />
        <input className="input-field" placeholder="#C15A3D" value={form.color_hex} onChange={(e) => onChange({ ...form, color_hex: e.target.value })} />
        <input className="input-field" type="number" min={0} value={form.sort_order} onChange={(e) => onChange({ ...form, sort_order: Number(e.target.value) })} />
        <label className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <input type="checkbox" checked={form.is_active} onChange={(e) => onChange({ ...form, is_active: e.target.checked })} />
          Active
        </label>
      </div>
      <textarea className="input-field min-h-[88px]" placeholder="Description" value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} />
      <button disabled={saving || !form.name || !form.slug} className="btn-primary" onClick={onSave}>
        <Save size={16} />
        Save
      </button>
    </div>
  );
}

function SubcategoryFormView({
  title,
  form,
  saving,
  onChange,
  onCancel,
  onSave,
}: {
  title: string;
  form: SubcategoryForm;
  saving: boolean;
  onChange: (form: SubcategoryForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-text-primary">{title}</h4>
        <button className="btn-ghost" onClick={onCancel}><X size={16} /></button>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <input className="input-field" placeholder="Name" value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} />
        <input className="input-field" placeholder="Slug" value={form.slug} onChange={(e) => onChange({ ...form, slug: slugify(e.target.value) })} />
        <input className="input-field" type="number" min={0} value={form.sort_order} onChange={(e) => onChange({ ...form, sort_order: Number(e.target.value) })} />
        <label className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <input type="checkbox" checked={form.is_active} onChange={(e) => onChange({ ...form, is_active: e.target.checked })} />
          Active
        </label>
      </div>
      <textarea className="input-field min-h-[72px]" placeholder="Description" value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} />
      <button disabled={saving || !form.name || !form.slug} className="btn-primary" onClick={onSave}>
        <Save size={16} />
        Save
      </button>
    </div>
  );
}
