/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { Button } from '../../../Button';
import { ButtonStyle, ButtonSize } from '../../../Button/types';

type onClickFunction = (row: object, index: number) => void;

export interface ButtonCellProps {
  label: string;
  onClick: onClickFunction;
  row: object;
  index: number;
  tooltip?: string;
  buttonStyle?: ButtonStyle;
  buttonSize?: ButtonSize;
}

export function ButtonCell(props: ButtonCellProps) {
  const {
    label,
    onClick,
    row,
    index,
    tooltip,
    buttonStyle = 'primary',
    buttonSize = 'small',
  } = props;

  return (
    <Button
      buttonStyle={buttonStyle}
      buttonSize={buttonSize}
      onClick={() => onClick?.(row, index)}
      key={`${buttonStyle}_${buttonSize}`}
      tooltip={tooltip}
    >
      {label}
    </Button>
  );
}

export default ButtonCell;
