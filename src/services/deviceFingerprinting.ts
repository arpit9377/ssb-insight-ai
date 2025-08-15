import { supabase } from '@/integrations/supabase/client';

export interface DeviceFingerprint {
  fingerprint_hash: string;
  ip_address?: string;
  user_agent: string;
  screen_resolution: string;
  timezone: string;
}

class DeviceFingerprintingService {
  generateFingerprint(): DeviceFingerprint {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx!.textBaseline = 'top';
    ctx!.font = '14px Arial';
    ctx!.fillText('Device fingerprint canvas', 2, 2);
    
    const canvasFingerprint = canvas.toDataURL();
    
    const fingerprint = {
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvas: canvasFingerprint,
      language: navigator.language,
      platform: navigator.platform,
      cookie_enabled: navigator.cookieEnabled,
      do_not_track: navigator.doNotTrack || 'unspecified'
    };

    // Create hash from fingerprint data
    const fingerprintString = JSON.stringify(fingerprint);
    const fingerprintHash = btoa(fingerprintString).substring(0, 64);

    return {
      fingerprint_hash: fingerprintHash,
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  async recordFingerprint(userId: string): Promise<boolean> {
    try {
      const fingerprint = this.generateFingerprint();

      // Check if this fingerprint already exists for this user
      const { data: existing } = await supabase
        .from('device_fingerprints')
        .select('id')
        .eq('user_id', userId)
        .eq('fingerprint_hash', fingerprint.fingerprint_hash)
        .single();

      if (existing) {
        // Update last seen
        await supabase
          .from('device_fingerprints')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        // Create new fingerprint record
        await supabase
          .from('device_fingerprints')
          .insert({
            user_id: userId,
            ...fingerprint
          });
      }

      return true;
    } catch (error) {
      console.error('Error recording device fingerprint:', error);
      return false;
    }
  }

  async checkDeviceLimit(fingerprint: DeviceFingerprint): Promise<{ allowed: boolean; accountCount: number }> {
    try {
      const { data: devices } = await supabase
        .from('device_fingerprints')
        .select('user_id')
        .eq('fingerprint_hash', fingerprint.fingerprint_hash);

      const uniqueUsers = new Set(devices?.map(d => d.user_id) || []);
      const accountCount = uniqueUsers.size;
      
      // Allow max 2 accounts per device/fingerprint
      return {
        allowed: accountCount < 2,
        accountCount
      };
    } catch (error) {
      console.error('Error checking device limit:', error);
      return { allowed: true, accountCount: 0 };
    }
  }

  async getDeviceInfo(userId: string) {
    try {
      const { data } = await supabase
        .from('device_fingerprints')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return data || [];
    } catch (error) {
      console.error('Error getting device info:', error);
      return [];
    }
  }
}

export const deviceFingerprintingService = new DeviceFingerprintingService();