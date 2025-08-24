import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
}

export const fetchUsersWithRole = async (role: string = 'user'): Promise<UserData[]> => {
  try {
    console.log(`Fetching users with role: ${role}`);
    
    const usersQuery = query(
      collection(db, 'users'),
      where('role', '==', role)
    );
    
    const snapshot = await getDocs(usersQuery);
    
    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Unknown',
        email: data.email || '',
        role: data.role || 'user',
        status: data.status || 'active',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
        lastLogin: data.lastLogin?.toDate?.()?.toISOString() || data.lastLogin || null
      } as UserData;
    });
    
    // Sort by createdAt if available, otherwise by id
    users.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.id.localeCompare(b.id);
    });
    
    console.log(`Found ${users.length} users with role ${role}:`, users);
    return users;
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Never';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
};

export const getUserStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'inactive':
      return 'bg-red-100 text-red-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
