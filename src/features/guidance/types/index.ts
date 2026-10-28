export interface GuidanceItem {
  guidance: string;
  is_completed: boolean;
  completed_at?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CompleteGuidancePayload {
  action?: 'complete' | 'skip';
  skipped?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AdvanceOnConfig {
  type: 'click' | 'input' | 'change' | 'custom-event' | 'mutation-success';
  event?: string;
  target?: string;
  validate?: () => boolean;
}

export interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  advanceOn?: AdvanceOnConfig;
  requireAction?: boolean;
  fallbackTimeoutMs?: number;
}

export interface FeatureGuidanceConfig {
  key: string;
  title: string;
  description: string;
  route: string;
  steps: TourStep[];
}

export interface GuidanceProgressItem {
  key: string;
  config: FeatureGuidanceConfig;
  isCompleted: boolean;
  isSkipped: boolean;
  completedAt?: string | null;
}
