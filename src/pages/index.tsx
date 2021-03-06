import {
  useState, useMemo, useCallback, ChangeEvent,
} from 'react';
import { queryCache } from 'react-query';
import routeService from 'next/router';

import Button from '../components/atoms/Button';
import Subtitle from '../components/atoms/Subtitle';
import Input from '../components/atoms/Input';

import MemberList from '../components/organisms/MemberList';
import Section from '../components/organisms/Section';

import PageTemplate from '../components/templates/PageTemplate';

import useMembers from '../hooks/useMembers';

import { mapToResult } from '../utils/client/format.util';
import { compareMember } from '../utils/common/compare.util';
import { getShuffledArray, getBalancedChunks } from '../utils/common/array.util';

const Home: React.FC = () => {
  const [selected, setSelected] = useState<Member[]>([]);
  const [size, setSize] = useState(0);
  const {
    info: { status, data: members },
  } = useMembers({
    onSuccess: (val) => {
      setSelected(val);
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const unselected = useMemo(
    () => members?.filter((member) => !selected.find((select) => select.id === member.id)).sort(compareMember) ?? [],
    [members, selected],
  );

  const handleSizeChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.value === '') {
      setSize(0);
      return;
    }

    setSize(parseInt(event.target.value, 10));
  }, []);

  const isRouletteDisabled = useMemo(() => size === 0 || size > selected.length, [selected, size]);

  const handleSelect = useCallback((id: string) => {
    const newMember = members?.find((member) => member.id === id);
    setSelected((prev) => (
      newMember
        ? prev.concat(newMember).sort(compareMember)
        : prev
    ));
  }, [members]);

  const handleUnselect = useCallback((id: string) => {
    setSelected((prev) => prev.filter((m) => m.id !== id).sort(compareMember));
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelected((members ?? []).sort());
  }, [members]);

  const handleUnselectAll = useCallback(() => {
    setSelected([]);
  }, []);

  const handleRoulette = useCallback(() => {
    const result = mapToResult(getBalancedChunks(getShuffledArray(selected), size));
    queryCache.setQueryData('result', () => result);
    routeService.push('/result');
  }, [selected, size]);

  return (
    <PageTemplate>
      <Section title="??????">
        <div className="mb-4" />
        {
          status === 'loading' && <div>?????? ???</div>
        }
        {
          status === 'error' && <div>?????? ??????!</div>
        }
        {
          status === 'success' && (
            <>
              <MemberList title="?????? ??????" selectAllText="?????? ??????" onMemberSelect={handleUnselect} onSelectAll={handleUnselectAll} members={selected} />
              <MemberList title="?????? ??????" selectAllText="?????? ??????" onMemberSelect={handleSelect} onSelectAll={handleSelectAll} members={unselected} />
              <div>
                <Subtitle>????????? ????????? ??????</Subtitle>
                <div className="flex flex-row items-center mt-4">
                  <div className="mr-3">??? ?????? ???</div>
                  <Input value={size} onChange={handleSizeChange} className="w-16" />
                  <div className="mx-3">?????? ???????????? ??????</div>
                  <Button variant="primary" color="indigo" size="big" disabled={isRouletteDisabled} onClick={handleRoulette}>?????????</Button>
                </div>
                {
                  isRouletteDisabled && (
                    <div className="text-red-400">
                      {size === 0 && '????????? ?????? ?????????..? ????'}
                      {size > selected.length && '???... ?????? ??? ?????? ??? ?????????!'}
                    </div>
                  )
                }
              </div>
            </>
          )
        }
      </Section>
    </PageTemplate>
  );
};

export default Home;
