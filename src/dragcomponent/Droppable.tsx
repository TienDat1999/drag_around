import update from "immutability-helper";
import { CSSProperties, FC, useEffect } from "react";
import { useCallback, useState } from "react";
import { useDrop } from "react-dnd";

import { DraggableBox } from "./DraggableBox";
import type { DragItem } from "./interfaces";
import { ItemTypes } from "./ItemTypes";
import { snapToGrid as doSnapToGrid } from "./snapToGrid";

const styles: CSSProperties = {
  width: 300,
  height: 300,
  border: "1px solid black",
  position: "relative",
};

export interface ContainerProps {
  snapToGrid: boolean;
}

interface BoxMap {
  [key: string]: { top: number; left: number; title: string };
}
const GAP_ROW = 60;
const Droppable: FC<ContainerProps> = ({ snapToGrid }) => {
  const [boxes, setBoxes] = useState<BoxMap>({
    a: { top: 0, left: 80, title: "aa" },
    b: { top: 60, left: 20, title: "bbb" },
    c: { top: 60, left: 80, title: "cccc" },
    d: { top: 120, left: 20, title: "ddđ" },
  });

  const [gapRowList] = useState<number[]>(() =>
    Object.keys(boxes).map((item, index) => {
      return index * GAP_ROW;
    })
  );
  const [boundingElm, setBoundingElm] = useState<any>();

  const moveBox = useCallback(
    (id: string, left: number, top: number) => {
      setBoxes(
        update(boxes, {
          [id]: {
            $merge: { left, top },
          },
        })
      );
    },
    [boxes]
  );

  const [{ canDrop, isOver }, drop] = useDrop(
    () => ({
      accept: "box",
      drop(item: DragItem, monitor) {
        // console.log('monitor', item);

        const delta = monitor.getDifferenceFromInitialOffset() as {
          x: number;
          y: number;
        };

        let left = Math.round(item.left + delta.x);
        let top = Math.round(item.top + delta.y);

        const rangeClosest = findRowShouldDropOn(top);

        handleOverlapsOnRow({ left: left, top: rangeClosest, id: item.id });

        return undefined;
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
      hover(item, monitor) {
        const delta = monitor.getDifferenceFromInitialOffset() as {
          x: number;
          y: number;
        };
        //  console.log(delta);
      },
    }),

    [moveBox]
  );

  const handleOverlapsOnRow = (position: {
    left: number;
    top: number;
    id: string;
  }) => {

    const cardsOnCurrentRow: { start: number; end: number; id: string }[] = [];

    const currentCardBounding = document
      .getElementById(position.id)
      ?.getBoundingClientRect() as any;

    const currentCard = {
      start: position.left,
      end: position.left + currentCardBounding?.width,
      id: position.id
    };

    // console.log('currentCardFocusInstance', currentCardFocusInstance);

    Object.entries(boxes).forEach(([key, value]) => {
      
      if (position.top === value.top && position.id !== key) {
        const elm = document.getElementById(key) as HTMLButtonElement | null;

        if (elm?.getBoundingClientRect()?.width) {
          cardsOnCurrentRow.push({
            id: key,
            start: value.left,
            end: value.left + elm.getBoundingClientRect().width,
          });
        }
      }
      cardsOnCurrentRow.sort((a, b) => a.start - b.start)
      
    });

    if(!cardsOnCurrentRow.length) {
      moveBox(position.id, position.left, position.top);
      return
    }

    const result = [] as any;

    for (let i = 0; i < cardsOnCurrentRow.length; i++) {
      const {start, end, id} = cardsOnCurrentRow[i];
    
      // check if range overlaps with input range
      if (start < currentCard.end && end > currentCard.start) {
        const overlapStart = end + 1;
        const overlapEnd = currentCard.end - currentCard.start + end + 1;
        

        const index = result.findIndex((item: any) => item.id === currentCard.id)
        if(index > - 1) {
          result.splice(index,1,{
            start: overlapStart,
            end: overlapEnd,
            id: currentCard.id
          })
        } else {
          result.push({
            start: overlapStart,
            end: overlapEnd,
            id: currentCard.id
          })

        }
       // set new current card
        currentCard.end = overlapEnd
        currentCard.start = overlapStart
        currentCard.id = cardsOnCurrentRow[i+1].id

      } else {
        //case: no overlaps any elm on row
        //purpose: to have the a element on that row for result render
        if(!result.length) {
          result.push(currentCard);
        }
        // moveBox(position.id, position.left, position.top);
      }
    }

    result.forEach((item: any) => {
      moveBox(item.id, item.start, position.top);
    })

  };

  // const findIndexOverlapsOnRow = (
  //   left: number,
  //   cardsOnCurrentRow: { start: number; end: number }[]
  // ) => {
  //   let index = -1;

  //   index = cardsOnCurrentRow.findIndex((item) => {
  //     if (item.start < left && item.end > left) {
  //       return item;
  //     }
  //   });
  //   return index;
  // };

  useEffect(() => {
    // console.log('canDrop', canDrop);
    // console.log('isOver', isOver);
  }, [canDrop, isOver]);


  const findRowShouldDropOn = (num: number) => {
    gapRowList.sort((a, b) => a - b);
    let closestNum = gapRowList[0];

    for (let i = 1; i < gapRowList.length; i++) {
      const prevDiff = Math.abs(num - closestNum);
      const currDiff = Math.abs(num - gapRowList[i]);

      if (currDiff < prevDiff) {
        closestNum = gapRowList[i];
      }
    }
    return closestNum;
  };

  return (
    <div ref={drop} style={styles}>
      {Object.keys(boxes).map((item, index) => {
        return (
          <div
            style={{
              borderBottom: "1px solid",
              position: "absolute",
              top: 60 * (index + 1),
              width: "100%",
            }}
          ></div>
        );
      })}
      {Object.keys(boxes).map((key) => (
        <DraggableBox
          key={key}
          id={key}
          {...(boxes[key] as { top: number; left: number; title: string })}
          // boundingReact={boundingReact}
        />
      ))}
    </div>
  );
};

export default Droppable;
