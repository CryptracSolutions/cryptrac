'use client';

import { useRoleGuard, logout, isAdmin } from '@/lib/auth-guards';

export default function AdminDashboard() {
  const { session, loading } = useRoleGuard(['admin']);

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

  if (!session || !isAdmin(session)) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <h1>Access Denied</h1>
        <p>Admin access is restricted to authorized personnel only.</p>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '2px solid #dc3545'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#dc3545' }}>Admin Dashboard</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
            Platform Administration - {session.user.email}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ 
            padding: '4px 8px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            borderRadius: '4px',
            fontSize: '12px',
            textTransform: 'uppercase',
            fontWeight: 'bold'
          }}>
            ADMIN
          </span>
          <button 
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
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

      {/* Platform Stats */}
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
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Total Merchants</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#7f5efd' }}>
            0
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
            Active accounts
          </p>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          border: '1px solid #eee',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Platform Revenue</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
            $0.00
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
            Total collected
          </p>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          border: '1px solid #eee',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Sales Reps</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#17a2b8' }}>
            0
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
            Active reps
          </p>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          border: '1px solid #eee',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Partners</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
            0
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
            Active partners
          </p>
        </div>
      </div>

      {/* Admin Actions */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>Admin Actions</h2>
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
            Manage Merchants
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
            Manage Reps
          </button>
          
          <button style={{
            padding: '15px',
            backgroundColor: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            Manage Partners
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
            Process Payouts
          </button>
          
          <button style={{
            padding: '15px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            Support Inbox
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
            System Logs
          </button>
        </div>
      </div>

      {/* System Health */}
      <div>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>System Health</h2>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          border: '1px solid #eee',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Database</h4>
              <span style={{ 
                padding: '4px 8px', 
                backgroundColor: '#28a745', 
                color: 'white', 
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                ONLINE
              </span>
            </div>
            
            <div>
              <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Payment Gateway</h4>
              <span style={{ 
                padding: '4px 8px', 
                backgroundColor: '#28a745', 
                color: 'white', 
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                ONLINE
              </span>
            </div>
            
            <div>
              <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Email Service</h4>
              <span style={{ 
                padding: '4px 8px', 
                backgroundColor: '#28a745', 
                color: 'white', 
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                ONLINE
              </span>
            </div>
            
            <div>
              <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Last Backup</h4>
              <span style={{ 
                padding: '4px 8px', 
                backgroundColor: '#ffc107', 
                color: 'black', 
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                PENDING
              </span>
            </div>
          </div>
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
          <strong>Admin Debug Info:</strong>
          <pre style={{ margin: '10px 0 0 0', overflow: 'auto' }}>
            {JSON.stringify({
              email: session.user.email,
              role: session.role,
              isAdmin: isAdmin(session),
              metadata: session.user.user_metadata
            }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
