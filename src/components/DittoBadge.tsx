import { useDraggable } from '@dnd-kit/react';
import { DITTO_NAME } from '../constants'

type DittoBadgeProps = {
  houseId: number;
  onActivate: () => void;
  isDraggable: boolean;
};

const DittoBadge = ({ houseId, onActivate, isDraggable }: DittoBadgeProps) => {
  const { ref } = useDraggable({
    id: `${DITTO_NAME}:${houseId}`,
    disabled: !isDraggable,
  });

  const handleActivate = () => {
    onActivate();
  };

  return (
    <span
      ref={ref}
      className="ditto-badge ditto-badge-draggable"
      onClick={(event) => {
        event.stopPropagation();
        handleActivate();
      }}
      onPointerUp={(event) => {
        if (event.button === 0) {
          event.stopPropagation();
          handleActivate();
        }
      }}
      title="Remove or drag Ditto flag"
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          handleActivate();
        }
      }}
    >
      <img src="https://www.serebii.net/pokemonpokopia/items/dittoflag.png" alt="Ditto flag" />
    </span>
  );
};

export default DittoBadge;