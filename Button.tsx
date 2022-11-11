import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  disabled?: boolean;
  children?: React.ReactNode;
  onPress?: () => void;
  href?: string;
  title?: string;
  className?: string;
  preventDefault?: boolean;
};

export default function Button({
  disabled,
  className,
  children,
  title,
  onPress,
  preventDefault,
  href,
}: Props) {
  let navigate = useNavigate();

  const onClick = useCallback(
    (e: React.SyntheticEvent) => {
      if (preventDefault) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (href && !href.startsWith("https:")) {
        navigate(href);
      }

      if (href && href.startsWith("https:")) {
        window.location.href = href;
      }

      if (onPress) onPress();
    },
    [onPress, href, history, preventDefault]
  );

  return (
    <button
      type="button"
      className={className ? `Button ${className}` : "Button"}
      disabled={disabled}
      title={title || (typeof children === "string" ? children : "")}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
