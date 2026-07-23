import { useEffect, useState, type HTMLAttributes } from "react";

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  avatar?: string | null;
  username?: string | null;
}

export const initials = (username?: string | null) =>
  username ? username.slice(0, 2).toUpperCase() : "U";

export default function Avatar({
  avatar,
  username,
  className = "",
  ...props
}: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [avatar]);

  return (
    <div
      {...props}
      className={`${className} overflow-hidden shrink-0`}
    >
      {avatar && !imageFailed ? (
        <img
          src={avatar}
          alt={username || "Avatar"}
          className="w-full h-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        initials(username)
      )}
    </div>
  );
}
