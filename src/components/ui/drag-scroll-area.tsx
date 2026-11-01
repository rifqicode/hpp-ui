import { useRef, useState, type ComponentProps, type PointerEvent } from 'react';
import { cn } from '@/lib/utils';

type DragScrollAreaProps = Omit<
  ComponentProps<'div'>,
  | 'ref'
  | 'onPointerDown'
  | 'onPointerMove'
  | 'onPointerUp'
  | 'onPointerCancel'
  | 'onLostPointerCapture'
  | 'onClickCapture'
>;

export function DragScrollArea({ className, children, ...props }: DragScrollAreaProps) {
  const [dragging, setDragging] = useState(false);
  const gesture = useRef<{
    pointerId: number;
    x: number;
    y: number;
    scrollLeft: number;
    dragging: boolean;
  } | null>(null);
  const suppressClick = useRef(false);

  function start(event: PointerEvent<HTMLDivElement>) {
    suppressClick.current = false;
    const area = event.currentTarget;
    if (
      event.pointerType !== 'mouse' ||
      event.button !== 0 ||
      gesture.current ||
      area.scrollWidth <= area.clientWidth
    )
      return;
    if (
      !(event.target instanceof Element) ||
      event.target.closest(
        'a, button, input, select, textarea, label, summary, [role="button"], [contenteditable]:not([contenteditable="false"]), [draggable]',
      )
    )
      return;
    const bounds = area.getBoundingClientRect();
    if (
      event.clientY >= bounds.top + area.clientHeight ||
      event.clientX >= bounds.left + area.clientWidth
    )
      return;

    gesture.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      scrollLeft: area.scrollLeft,
      dragging: false,
    };
    area.setPointerCapture(event.pointerId);
    area.focus({ preventScroll: true });
    event.preventDefault();
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    const active = gesture.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const delta = event.clientX - active.x;
    if (!active.dragging) {
      if (Math.abs(delta) < 6 || Math.abs(delta) <= Math.abs(event.clientY - active.y)) return;
      active.dragging = true;
      suppressClick.current = true;
      setDragging(true);
    }
    event.preventDefault();
    event.currentTarget.scrollLeft = active.scrollLeft - delta;
  }

  function end(event: PointerEvent<HTMLDivElement>) {
    if (gesture.current?.pointerId !== event.pointerId) return;
    gesture.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <div
      {...props}
      role={props.role ?? 'region'}
      tabIndex={props.tabIndex ?? 0}
      data-dragging={dragging || undefined}
      className={cn(
        'min-w-0 overflow-x-auto cursor-grab rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-[dragging=true]:cursor-grabbing data-[dragging=true]:select-none',
        className,
      )}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
      onClickCapture={event => {
        if (suppressClick.current && event.detail !== 0) {
          event.preventDefault();
          event.stopPropagation();
          suppressClick.current = false;
        }
      }}
    >
      {children}
    </div>
  );
}
