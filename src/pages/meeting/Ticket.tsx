import React from 'react';
import cx from 'classnames';

import { TicketShape } from 'schema';
import closestFib from 'utils/closestFib';
import AvatarList from 'components/AvatarList';
import { Trash, Target, PlusCircle, Edit, Loader, Check } from 'svgs';

import RadioSet from './RadioSet';
import MoreDropdown from 'components/MoreDropdown';
import { UserShape } from 'services/utils';
import fservice from 'services/fservice';
import TicketForm from './NewTicketForm';
import ProfileContext from 'containers/Profile';
import Button from 'components/Buttons';

type MyProps = {
  mid: string;
  ticket: TicketShape;
  currentVote: number;
  disableVoting: boolean;
  onFocusClick: () => any;
  voterList: UserShape[];
};

const Ticket: React.FunctionComponent<MyProps> = ({
  mid,
  ticket: t,
  currentVote,
  disableVoting,
  onFocusClick,
  voterList,
}) => {
  const [isEditMode, setIsEditMode] = React.useState(false);
  const profile = React.useContext(ProfileContext);

  if (isEditMode) {
    return (
      <article className="my-3">
        <TicketForm
          ticket={{
            title: t.title,
            link: t.link,
            description: t.description,
            source: t.source,
          }}
          onSubmit={updatedFields =>
            fservice.updateTicket(mid, { id: t.id, ...updatedFields }).then(() => {
              setIsEditMode(false);
            })
          }
          formButtons={
            <div className="flex">
              <Button type="submit" className="mr-3">
                <PlusCircle className="w-5 h-5 mr-2" />
                Update Ticket
              </Button>
              <button type="button" onClick={() => setIsEditMode(false)}>
                Cancel
              </button>
            </div>
          }
        />
      </article>
    );
  }

  return (
    <article>
      <header className="flex items-baseline mb-2">
        <h1 className="text-lg leading-tight flex-1">
          <Title title={t.title} link={t.link} />
        </h1>
        <button
          title="Draw focus to this ticket for all users"
          type="button"
          onClick={onFocusClick}
          className="btn-fab btn--grey ml-3"
        >
          <Target className="w-4 h-4" />
        </button>
        <MoreDropdown>
          <button
            type="button"
            className={cx('flex w-full text-left', 'px-6 py-2', 'hover:bg-grey-1')}
            onClick={() => setIsEditMode(true)}
          >
            <Edit className="w-4 h-4 mr-6" />
            <span className="flex-1">Edit</span>
          </button>
          <hr className="border-b my-2" />
          <button
            type="button"
            className={cx('flex w-full text-left', 'px-6 py-2', 'hover:bg-grey-1')}
            onClick={() => fservice.deleteTicket(mid, t.id)}
          >
            <Trash className="w-4 h-4 mr-6" />
            <span className="flex-1">Delete</span>
          </button>
        </MoreDropdown>
      </header>

      {t.description && <div className="mb-3">{t.description}</div>}

      {t.isRevealed && (
        <>
          <div className="mb-2">Average: {closestFib(Object.values(t.votes))}</div>
          {/* if hasCreds && ticket.isJira*/}

          {t.source === 'jira' && profile !== null && profile.hasCreds && (
            <div className="mb-2">
              <JiraPushForm
                ticket={t}
                initialValue={
                  t.committedValue !== undefined
                    ? t.committedValue
                    : closestFib(Object.values(t.votes))
                }
                onSubmit={value =>
                  fservice.pushPointsToJira({ [t.id]: value }).then(() => {
                    fservice.updateTicket(mid, { id: t.id, committedValue: value });
                  })
                }
              />
            </div>
          )}
        </>
      )}
      <div className="mb-2">
        {!t.isRevealed && (
          <button
            type="button"
            className="text-violet-5 underline"
            onClick={() => fservice.revealTicket(mid, t.id)}
          >
            Reveal votes
          </button>
        )}
      </div>

      <form className="mb-2">
        <RadioSet
          id={t.id}
          value={currentVote}
          onChange={vote => fservice.voteOnTicket(mid, t.id, vote)}
          allVotes={t.isRevealed ? summarizeVotes(t.votes) : {}}
          disabled={disableVoting}
        />
      </form>

      <div className="mx-1">
        <AvatarList
          userList={voterList}
          getDotColor={id => (t.votes[id] === undefined ? 'bg-red-1' : '')}
        />
      </div>
    </article>
  );
};

/**
 * Go from {uid: option} to {option: totalVotes}
 */
function summarizeVotes(votes: { [uid: string]: number }): { [vote: number]: number } {
  return Object.values(votes).reduce<{ [key: number]: number }>(
    (prev, cur) => ({ ...prev, [cur]: (prev[cur] || 0) + 1 }),
    {}
  );
}

type TitleProps = { title: string; link: string };
export const Title: React.FunctionComponent<TitleProps> = ({ title, link }) => {
  if (link) {
    return (
      <a href={link} target="_blank">
        {title}
      </a>
    );
  }

  // TODO: deprecate turning part of the title into a link
  const URLRegex = /^(http[s]?:\/\/|www\.)+[^\s]+[\w]/;
  const linkPieces = title.match(URLRegex);
  if (linkPieces !== null) {
    const link = linkPieces[0];
    const restOfTitle = title.replace(linkPieces[0], '');
    return (
      <>
        <a href={link} target="_blank">
          {link}
        </a>
        {restOfTitle}
      </>
    );
  }
  // end TODO

  return <>{title}</>;
};

const JiraPushForm: React.FC<{
  ticket: TicketShape;
  onSubmit: (value: number) => any;
  initialValue: number;
}> = ({ ticket, initialValue, onSubmit }) => {
  const [committedValue, updateValue] = React.useState<number | ''>(initialValue);
  const [isSubmitting, updateSubmit] = React.useState(false);

  return (
    <form
      className=""
      method="POST"
      onSubmit={e => {
        e.preventDefault();
        if (committedValue === '') {
          // We could add an error here
          return;
        }
        updateSubmit(true);
        onSubmit(committedValue).then(() => {
          updateSubmit(false);
        });
      }}
    >
      <div className="inline-flex items-center">
        <label>Committed value:</label>
        <input
          type="text"
          required
          disabled={isSubmitting}
          value={committedValue}
          onChange={e => {
            const v = parseInt(e.target.value, 10);
            updateValue(isNaN(v) ? '' : v);
          }}
          className={cx(
            'mx-2 w-10 text-center',
            'py-2 placeholder:text-grey-8',
            'border-b border-gray-3',
            'outline-none focus:border-teal-7'
          )}
        />
        {/* TODO: new class? */}
        <button
          disabled={isSubmitting}
          className={cx(
            'bg-teal-7 hover:bg-teal-8',
            'text-teal-1 hover:text-teal-2 font-bold font-header leading-none',
            'px-3 py-2 rounded-sm shadow-md',
            'flex items-center'
          )}
          type="submit"
        >
          {ticket.committedValue === committedValue && <Check className="w-4 h-4 mr-2" />}
          {isSubmitting && <Loader className="animate-spin w-4 h-4 mr-2" />}
          Push to Jira
        </button>
      </div>
    </form>
  );
};
export default Ticket;
