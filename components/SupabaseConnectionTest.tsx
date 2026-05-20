import { useEffect } from 'react';
import { supabase } from '../src/lib/supabase';

const SupabaseConnectionTest: React.FC = () => {
  useEffect(() => {
    const testSupabaseConnection = async () => {
      if (!supabase) {
        console.warn('Supabase connection test skipped because env vars are missing.');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .limit(1);

        if (error) {
          console.error('Supabase profiles query error:', error);
          return;
        }

        console.log('Supabase profiles query success:', data);
      } catch (error) {
        console.error('Supabase connection error:', error);
      }
    };

    testSupabaseConnection();
  }, []);

  return null;
};

export default SupabaseConnectionTest;
