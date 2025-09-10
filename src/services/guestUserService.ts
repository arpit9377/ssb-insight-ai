interface GuestTestLimits {
  tat: number;
  ppdt: number;
  wat: number;
  srt: number;
}

class GuestUserService {
  private readonly GUEST_ID_KEY = 'guest_user_id';
  private readonly GUEST_LIMITS_KEY = 'guest_test_limits';
  
  private readonly DEFAULT_GUEST_LIMITS: GuestTestLimits = {
    tat: 1,
    ppdt: 1,
    wat: 1,
    srt: 1
  };

  generateGuestId(): string {
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(this.GUEST_ID_KEY, guestId);
    this.initializeGuestLimits();
    return guestId;
  }

  getGuestId(): string | null {
    return sessionStorage.getItem(this.GUEST_ID_KEY);
  }

  getOrCreateGuestId(): string {
    const existingId = this.getGuestId();
    if (existingId) {
      return existingId;
    }
    return this.generateGuestId();
  }

  isGuestUser(userId: string): boolean {
    return userId.startsWith('guest_');
  }

  private initializeGuestLimits(): void {
    if (!sessionStorage.getItem(this.GUEST_LIMITS_KEY)) {
      sessionStorage.setItem(this.GUEST_LIMITS_KEY, JSON.stringify(this.DEFAULT_GUEST_LIMITS));
    }
  }

  getGuestLimits(): GuestTestLimits {
    const limits = sessionStorage.getItem(this.GUEST_LIMITS_KEY);
    if (limits) {
      return JSON.parse(limits);
    }
    this.initializeGuestLimits();
    return { ...this.DEFAULT_GUEST_LIMITS };
  }

  checkGuestTestAvailability(testType: string): boolean {
    const limits = this.getGuestLimits();
    const remaining = limits[testType as keyof GuestTestLimits];
    return typeof remaining === 'number' && remaining > 0;
  }

  decrementGuestTestLimit(testType: string): boolean {
    const limits = this.getGuestLimits();
    const remaining = limits[testType as keyof GuestTestLimits];
    
    if (typeof remaining === 'number' && remaining > 0) {
      limits[testType as keyof GuestTestLimits] = remaining - 1;
      sessionStorage.setItem(this.GUEST_LIMITS_KEY, JSON.stringify(limits));
      return true;
    }
    return false;
  }

  clearGuestData(): void {
    sessionStorage.removeItem(this.GUEST_ID_KEY);
    sessionStorage.removeItem(this.GUEST_LIMITS_KEY);
  }

  hasUsedAnyTests(): boolean {
    const limits = this.getGuestLimits();
    const defaultLimits = this.DEFAULT_GUEST_LIMITS;
    
    return Object.keys(limits).some(key => {
      const testType = key as keyof GuestTestLimits;
      return limits[testType] < defaultLimits[testType];
    });
  }

  getRemainingTestsMessage(): string {
    const limits = this.getGuestLimits();
    const remainingTests = Object.entries(limits)
      .filter(([_, count]) => count > 0)
      .map(([test, count]) => `${test.toUpperCase()}: ${count}`)
      .join(', ');
    
    return remainingTests || 'No free tests remaining';
  }
}

export const guestUserService = new GuestUserService();