export interface OrderCategorySeed {
  name: string
  description: string
  color: string
}

export const ORDER_CATEGORY_SEED: OrderCategorySeed[] = [
  {
    name: 'Medicamente',
    description: 'Medicamente din ghidul clinicii (OR, farmacie, etaje)',
    color: '#dc2626',
  },
  {
    name: 'Materiale chirurgicale',
    description: 'Suturi, drape, mănuși sterile, comprese',
    color: '#2563eb',
  },
  {
    name: 'Consumabile',
    description: 'Seringi, catetere, pansamente, dezinfectanți',
    color: '#059669',
  },
  {
    name: 'Echipament',
    description: 'Instrumentar, mobilier medical, aparatură',
    color: '#7c3aed',
  },
  {
    name: 'Consumabile birou',
    description: 'Papetărie, formulare, consumabile administrative',
    color: '#6b7280',
  },
]
