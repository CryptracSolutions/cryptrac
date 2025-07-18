'use client';

import { useRoleGuard, logout } from '@/lib/auth-guards';

export default function MerchantDashboard() {
  const { session, loading } = useRoleGuard(['merchant', 'admin']);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect via useRoleGuard
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '1px solid #eee'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>Merchant Dashboard</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
            Welcome back, {session.user.user_metadata.business_name || session.user.email}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ 
            padding: '4px 8px', 
            backgroundColor: '#7f5efd', 
            color: 'white', 
            borderRadius: '4px',
            fontSize: '12px',
            textTransform: 'uppercase'
          }}>
            {session.role}
          </span>
          <button 
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          border: '1px solid #eee',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Total Revenue</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#7f5efd' }}>
            $0.00
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
            0 transactions
          </p>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          border: '1px solid #eee',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>This Month</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
            $0.00
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
            0 payments
          </p>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          border: '1px solid #eee',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Account Status</h3>
          <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#ffc107' }}>
            {session.user.user_metadata.setup_paid ? 'Active' : 'Trial'}
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
            {session.user.user_metadata.trial_end ? 
              `Trial ends: ${new Date(session.user.user_metadata.trial_end).toLocaleDateString()}` :
              'Setup complete'
            }
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>Quick Actions</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          <button style={{
            padding: '15px',
            backgroundColor: '#7f5efd',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            Create Payment Link
          </button>
          
          <button style={{
            padding: '15px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            Generate QR Code
          </button>
          
          <button style={{
            padding: '15px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            View Transactions
          </button>
          
          <button style={{
            padding: '15px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            Settings
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>Recent Activity</h2>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          border: '1px solid #eee',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <p style={{ color: '#666', margin: 0 }}>
            No transactions yet. Create your first payment link to get started!
          </p>
        </div>
      </div>

      {/* Debug Info (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          marginTop: '30px', 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          <strong>Debug Info:</strong>
          <pre style={{ margin: '10px 0 0 0', overflow: 'auto' }}>
            {JSON.stringify({
              email: session.user.email,
              role: session.role,
              country: session.country,
              metadata: session.user.user_metadata
            }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
