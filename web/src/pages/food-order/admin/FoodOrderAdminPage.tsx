import { useNavigate, useParams } from 'react-router-dom'
import { FoodOrderAdminHeader } from './components/FoodOrderAdminHeader'
import { MenuItemModal } from './components/MenuItemModal'
import { MenuPanel } from './components/MenuPanel'
import { OrdersPanel } from './components/OrdersPanel'
import { StatsPanel } from './components/StatsPanel'
import { TabsNav } from './components/TabsNav'
import { useFoodOrderAdmin } from './hooks/useFoodOrderAdmin'

export function FoodOrderAdminPage() {
  const { hotelId: hotelIdParam } = useParams<{ hotelId: string }>()
  const hotelId = Number(hotelIdParam)
  const navigate = useNavigate()
  const admin = useFoodOrderAdmin(hotelId)

  if (admin.loading) {
    return (
      <div className="min-h-screen bg-background-warm flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-warm">
      <FoodOrderAdminHeader
        hotelName={admin.hotel?.name}
        pendingCount={admin.pendingCount}
        onBack={() => navigate(`/admin/${hotelId}`)}
      />

      <main className="px-4 sm:px-8 py-6 max-w-6xl mx-auto">
        <TabsNav activeTab={admin.tab} pendingCount={admin.pendingCount} onChange={admin.setTab} />

        {admin.tab === 'stats' && admin.stats ? (
          <StatsPanel
            stats={admin.stats}
            onOpenOrders={(filter) => {
              admin.setOrderFilter(filter)
              admin.setTab('orders')
            }}
          />
        ) : null}

        {admin.tab === 'orders' ? (
          <OrdersPanel
            orders={admin.filteredOrders}
            filter={admin.orderFilter}
            counts={admin.orderCounts}
            onFilterChange={admin.setOrderFilter}
            onAction={admin.handleOrderAction}
          />
        ) : null}

        {admin.tab === 'menu' ? (
          <MenuPanel
            items={admin.menu}
            onAdd={() => admin.setMenuModal({ mode: 'create' })}
            onEdit={(item) => admin.setMenuModal({ mode: 'edit', item })}
            onDelete={admin.handleDeleteMenu}
          />
        ) : null}
      </main>

      {admin.menuModal ? (
        <MenuItemModal
          hotelId={hotelId}
          mode={admin.menuModal.mode}
          item={admin.menuModal.mode === 'edit' ? admin.menuModal.item : null}
          onClose={() => admin.setMenuModal(null)}
          onSaved={admin.handleMenuSaved}
        />
      ) : null}
    </div>
  )
}
