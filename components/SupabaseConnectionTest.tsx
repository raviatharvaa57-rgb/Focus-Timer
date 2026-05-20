import { useEffect, useState } from 'react';
import { supabase } from '../src/lib/supabase';

const SupabaseConnectionTest: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const testSupabaseConnection = async () => {
      if (!supabase) {
        console.warn('Supabase connection test skipped because env vars are missing.');
        console.log('Supabase profiles returned data:', null);
        console.log('Supabase profiles returned errors:', 'Supabase env vars are missing.');
        return;
      }

      try {
        console.log('Testing Supabase connection against profiles table...');

        const { data, error } = await supabase
          .from('profiles')
          .select('*');

        console.log('Supabase profiles returned data:', data);
        console.log('Supabase profiles returned errors:', error);

        if (error) {
          console.error('Supabase profiles query error:', error);
          return;
        }

        console.log('Supabase profiles query success:', data);
        setIsConnected(true);
      } catch (error) {
        console.log('Supabase profiles returned data:', null);
        console.log('Supabase profiles returned errors:', error);
        console.error('Supabase connection error:', error);
      }
    };

    testSupabaseConnection();
  }, []);

  if (!isConnected) {
    return null;
  }

  return (
    <div className="fixed bottom-24 left-1/2 z-[4000] -translate-x-1/2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 shadow-sm">
      Supabase Connected
    </div>
  );
};

export default SupabaseConnectionTest;
