import AvatarImg from 'components/AvatarImg';
import { UserShape } from 'services/utils';
import cx from 'classnames';

type MyProps = {
  userList: UserShape[];
  getDotColor?: (id: string) => string;
  imgSize?: 'small' | 'medium';
  onClick?: (id: string) => void;
  showPlaceholder?: boolean;
};

const AvatarList: React.FC<MyProps> = ({
  userList,
  getDotColor,
  imgSize = 'medium',
  showPlaceholder,
  onClick,
}) => {
  if (userList.length === 0 && !showPlaceholder) return null;

  const classNameSizes = cx({
    'w-6 h-6 mr-3': imgSize === 'small',
    'w-8 h-8 mr-3': imgSize === 'medium',
  });

  const isPlaceholderVisible = userList.length === 0 && showPlaceholder === true;

  return (
    <ul className="list-reset flex flex-wrap">
      {userList.map(user => (
        <li key={user.id} className="mb-3">
          <AvatarImg
            alt={user.displayName}
            src={user.photoURL}
            title={user.displayName}
            className={cx(classNameSizes, { 'cursor-pointer': onClick !== undefined })}
            dotColor={getDotColor && getDotColor(user.id)}
            onClick={() => onClick && onClick(user.id)}
          />
        </li>
      ))}
      {isPlaceholderVisible && (
        <li key="placeholder" className={cx(classNameSizes, 'rounded-full border bg-grey-2')} />
      )}
    </ul>
  );
};

export default AvatarList;
