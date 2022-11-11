import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { StyleSheet, Text, View } from "react-native";
import { SharedElementContextProvider } from "./lib/src";
import { SharedElement, useSharedElementContext } from "./lib/src";

import { DndProvider, useDrag, XYCoord } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

type ComponentKey = "image" | "title";
type Box = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const layouts: { [key in ComponentKey]: Box }[] = [
  {
    image: {
      top: 0,
      left: 0,
      width: 50,
      height: 50,
    },
    title: {
      top: 0,
      left: 60,
      // These are guessed and only used for drag drop
      width: 100,
      height: 25,
    },
  },
  {
    image: {
      top: 0,
      left: 50,
      width: 200,
      height: 200,
    },
    title: {
      top: 210,
      left: 90,
      // These are guessed and only used for drag drop
      width: 130,
      height: 90,
    },
  },
];

type OnStartDragParams = {
  id: ComponentKey;
  getClientOffset: () => XYCoord | null;
};

const isXYWithinBox = (x: number, y: number, box: Box) => {
  return (
    x >= box.left &&
    x <= box.left + box.width &&
    y >= box.top &&
    y <= box.top + box.height
  );
};

const useManageDragDropWithinCustomzableComponent = ({
  shouldChangeLayout,
}: {
  shouldChangeLayout: (layoutIndex: number) => void;
}) => {
  const loggerRef = useRef<null | NodeJS.Timer>(null);
  const validLayoutRef = useRef<number | null>(null);

  const onStartDrag = ({ id, getClientOffset }: OnStartDragParams) => {
    loggerRef.current = setInterval(() => {
      const pos = getClientOffset();
      if (pos !== null) {
        console.log("pos", pos, id);

        const boxesOfMatchingComponents: Box[] = layouts.map(
          (layout) => layout[id]
        );
        const validLayouts = boxesOfMatchingComponents.filter((box) =>
          isXYWithinBox(pos.x, pos.y, box)
        );

        validLayoutRef.current =
          boxesOfMatchingComponents.length === 0
            ? null
            : boxesOfMatchingComponents.indexOf(validLayouts[0]);

        if (validLayoutRef.current !== null && validLayoutRef.current > -1) {
          shouldChangeLayout(validLayoutRef.current);
        }
      }
    }, 100);
  };

  const onStopDrag = () => {
    if (loggerRef.current) {
      clearInterval(loggerRef.current);
      loggerRef.current = null;
      if (validLayoutRef.current !== null) {
        shouldChangeLayout(validLayoutRef.current);
      } else {
        console.log("No valid layout to nav to");
      }
    }
  };

  return {
    onStartDrag,
    onStopDrag,
  };
};

const useOnDragWithinCustomzableComponent = () => {
  return useContext(ComponentCusomizerContext);
};

const usePathnameForCandidateLayout = () => {
  return useContext(PathContext);
};

const useDraggableSharedElement = () => {
  const pathname = usePathnameForCandidateLayout();

  return { pathname, ...useOnDragWithinCustomzableComponent() };
};

const DraggableSharedElement = ({
  id,
  children,
}: {
  id: ComponentKey;
  children: ReactNode[] | ReactNode;
}) => {
  const { pathname } = useDraggableSharedElement();

  return (
    <SharedElement id={id} pathname={pathname}>
      <DraggableElement id={id}>{children}</DraggableElement>
    </SharedElement>
  );
};

const DraggableElement = ({
  children,
  id,
}: {
  children: ReactNode[] | ReactNode;
  id: ComponentKey;
}) => {
  const [{ opacity, isDragging, monitor }, dragRef] = useDrag(
    () => ({
      type: "something",
      item: {},
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 0.5 : 1,
        isDragging: monitor.isDragging(),
        monitor,
      }),
    }),
    []
  );

  const getClientOffset = monitor.getClientOffset.bind(monitor);

  const { onStartDrag, onStopDrag } = useDraggableSharedElement();

  useEffect(() => {
    if (isDragging) {
      // Cast is safe because this is the type when isDragging
      onStartDrag !== undefined && onStartDrag({ id, getClientOffset });
    } else {
      onStopDrag !== undefined && onStopDrag();
    }
  }, [isDragging]);

  return (
    <div
      ref={dragRef}
      style={{
        opacity,
      }}
    >
      {children}
    </div>
  );
};

const componentStyle = {
  width: 300,
  height: 300,
  position: "relative",
} as const;

const Component1 = () => {
  return (
    <View style={componentStyle}>
      <div
        style={{
          position: "absolute",
          top: layouts[0].image.top,
          left: layouts[0].image.left,
        }}
      >
        <DraggableSharedElement id="image">
          <img
            height={layouts[0].image.width}
            width={layouts[0].image.height}
            src="https://upload.wikimedia.org/wikipedia/commons/8/8a/Banana-Single.jpg"
          />
        </DraggableSharedElement>
      </div>
      <div
        style={{
          position: "absolute",
          top: layouts[0].title.top,
          left: layouts[0].title.left,
        }}
      >
        <DraggableSharedElement id="title">
          <Text style={{ fontSize: 20 }}>Banana</Text>
        </DraggableSharedElement>
      </div>
    </View>
  );
};

const Component2 = () => {
  return (
    <View style={componentStyle}>
      <div
        style={{
          position: "absolute",
          left: layouts[1].image.left,
          top: layouts[1].image.top,
        }}
      >
        <DraggableSharedElement id="image">
          <img
            height={layouts[1].image.height}
            width={layouts[1].image.width}
            src="https://upload.wikimedia.org/wikipedia/commons/8/8a/Banana-Single.jpg"
          />
        </DraggableSharedElement>
      </div>
      <div
        style={{
          position: "absolute",
          top: layouts[1].title.top,
          left: layouts[1].title.left,
        }}
      >
        <DraggableSharedElement id="title">
          <Text style={{ fontSize: 40 }}>Banana</Text>
        </DraggableSharedElement>
      </div>
    </View>
  );
};

const PathContext = createContext<string>("");
const ComponentCusomizerContext = createContext<{
  onStartDrag: (params: OnStartDragParams) => void;
  onStopDrag: () => void;
} | null>(null);

const Component1Wrapper = () => {
  const { isTransitioning, activePathname } = useSharedElementContext();
  const pathname = usePathnameForCandidateLayout();

  return (
    <View
      style={{
        opacity: isTransitioning || pathname !== activePathname ? 0 : 1,
      }}
    >
      <Component1 />
    </View>
  );
};

const Component2Wrapper = () => {
  const { isTransitioning, activePathname } = useSharedElementContext();
  const pathname = usePathnameForCandidateLayout();

  return (
    <View
      style={{
        opacity: isTransitioning || pathname !== activePathname ? 0 : 1,
      }}
    >
      <Component2 />
    </View>
  );
};

const CustomizableComponentProvider = ({
  children,
}: {
  children: ReactNode[];
}) => {
  const [preActivePathname, setPreActivePathname] = useState("0");
  const preActivePathnameInt =
    preActivePathname !== undefined ? parseInt(preActivePathname) : -1;

  const dragCallbacks = useManageDragDropWithinCustomzableComponent({
    shouldChangeLayout: (id) => {
      if (id >= 0) {
        setPreActivePathname(String(id));
      }
    },
  });

  if (children.length === 0) {
    throw new Error("No children provided to CustomizableComponentProvider");
  }

  return (
    <ComponentCusomizerContext.Provider value={dragCallbacks}>
      <DndProvider backend={HTML5Backend}>
        <SharedElementContextProvider pathname={preActivePathname}>
          <CustomizableComponentProviderInner
            preActivePathnameInt={preActivePathnameInt}
          >
            {children}
          </CustomizableComponentProviderInner>
        </SharedElementContextProvider>
      </DndProvider>
    </ComponentCusomizerContext.Provider>
  );
};

const CustomizableComponentProviderInner = ({
  children,
  preActivePathnameInt,
}: {
  children: ReactNode[];
  preActivePathnameInt: number;
}) => {
  const { activePathname } = useSharedElementContext();
  const activePathnameInt =
    activePathname !== undefined ? parseInt(activePathname) : 0;
  const activeChild = children[activePathnameInt];

  debugger;

  return (
    <>
      {/* // Need to do this instead of unmounting so the drag can still work (else it gets unmounted and drag aborts) */}
      <div
        style={{
          display:
            preActivePathnameInt === activePathnameInt ? "block" : "none",
        }}
      >
        <PathContext.Provider value={String(activePathnameInt)}>
          {activeChild}
        </PathContext.Provider>
      </div>
      {preActivePathnameInt >= 0 &&
        activePathnameInt !== preActivePathnameInt && (
          <PathContext.Provider value={String(preActivePathnameInt)}>
            {children[preActivePathnameInt]}
          </PathContext.Provider>
        )}
    </>
  );
};

export default function App() {
  return (
    <div
      style={{
        // marginTop: 30,
        borderWidth: 1,
        borderColor: "#ddd",
        borderStyle: "solid",
        // marginRight: "auto",
        // marginLeft: "auto",
        padding: 10,
        width: componentStyle.width,
      }}
    >
      <CustomizableComponentProvider>
        <Component1Wrapper></Component1Wrapper>
        <Component2Wrapper></Component2Wrapper>
      </CustomizableComponentProvider>
    </div>
  );
}
