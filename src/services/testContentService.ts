
import { supabase } from '@/integrations/supabase/client';

export class TestContentService {
  /**
   * Get random images for PPDT test (1 image)
   */
  static async getRandomPPDTImages(count: number = 1) {
    try {
      const { data, error } = await supabase
        .from('test_images')
        .select('*')
        .eq('test_type', 'ppdt')
        .eq('is_active', true);

      if (error) throw error;

      // Shuffle and return requested count
      const shuffled = data?.sort(() => 0.5 - Math.random()) || [];
      return shuffled.slice(0, count);
    } catch (error) {
      console.error('Error fetching PPDT images:', error);
      return [];
    }
  }

  /**
   * Get random images for TAT test (12 images)
   */
  static async getRandomTATImages(count: number = 12) {
    try {
      const { data, error } = await supabase
        .from('test_images')
        .select('*')
        .eq('test_type', 'tat')
        .eq('is_active', true);

      if (error) throw error;

      // Shuffle and return requested count
      const shuffled = data?.sort(() => 0.5 - Math.random()) || [];
      return shuffled.slice(0, count);
    } catch (error) {
      console.error('Error fetching TAT images:', error);
      return [];
    }
  }

  /**
   * Get random words for WAT test (60 words)
   */
  static async getRandomWATWords(count: number = 60) {
    try {
      const { data, error } = await supabase
        .from('wat_words')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      // Shuffle and return requested count
      const shuffled = data?.sort(() => 0.5 - Math.random()) || [];
      return shuffled.slice(0, count);
    } catch (error) {
      console.error('Error fetching WAT words:', error);
      return [];
    }
  }

  /**
   * Get random situations for SRT test (60 situations)
   */
  static async getRandomSRTSituations(count: number = 60) {
    try {
      const { data, error } = await supabase
        .from('srt_situations')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      // Shuffle and return requested count
      const shuffled = data?.sort(() => 0.5 - Math.random()) || [];
      return shuffled.slice(0, count);
    } catch (error) {
      console.error('Error fetching SRT situations:', error);
      return [];
    }
  }

  /**
   * Update usage count when content is used
   */
  static async updateUsageCount(type: 'images' | 'words' | 'situations', id: string) {
    try {
      let tableName = '';
      switch (type) {
        case 'images':
          tableName = 'test_images';
          break;
        case 'words':
          tableName = 'wat_words';
          break;
        case 'situations':
          tableName = 'srt_situations';
          break;
      }

      if (type === 'images') {
        // For images, we don't have usage_count field, so we skip this
        return;
      }

      const { error } = await supabase.rpc('increment_usage_count', {
        table_name: tableName,
        row_id: id
      });

      if (error) {
        console.error('Error updating usage count:', error);
      }
    } catch (error) {
      console.error('Error updating usage count:', error);
    }
  }

  /**
   * Get content statistics for admin
   */
  static async getContentStats() {
    try {
      const [imagesResult, wordsResult, situationsResult] = await Promise.all([
        supabase
          .from('test_images')
          .select('test_type', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('wat_words')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('srt_situations')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
      ]);

      return {
        totalImages: imagesResult.count || 0,
        totalWords: wordsResult.count || 0,
        totalSituations: situationsResult.count || 0
      };
    } catch (error) {
      console.error('Error fetching content stats:', error);
      return {
        totalImages: 0,
        totalWords: 0,
        totalSituations: 0
      };
    }
  }
}
