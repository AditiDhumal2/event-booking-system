'use client';

interface MakeAdminButtonProps {
  userId: string;
  makeAdminAction: (userId: string) => Promise<void>;
}

export default function MakeAdminButton({ userId, makeAdminAction }: MakeAdminButtonProps) {
  const handleClick = async () => {
    if (!confirm('Are you sure you want to make this user an admin?')) {
      return;
    }
    
    try {
      await makeAdminAction(userId);
      // Refresh the page after successful action
      window.location.reload();
    } catch (error) {
      console.error('Failed to make user admin:', error);
      alert('Failed to make user admin');
    }
  };

  return (
    <button 
      onClick={handleClick}
      className="text-blue-600 hover:text-blue-900 text-sm bg-blue-100 hover:bg-blue-200 py-1 px-3 rounded-md transition-colors"
    >
      Make Admin
    </button>
  );
}