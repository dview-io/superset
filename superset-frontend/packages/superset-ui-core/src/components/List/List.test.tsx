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
import { render, screen } from '@superset-ui/core/spec';
import { List } from '.';
import type { ListProps } from './types';

const mockedProps: ListProps<any> = {
  dataSource: ['Item 1', 'Item 2', 'Item 3'],
  renderItem: item => <div>{item}</div>,
};

test('should render', () => {
  const { container } = render(<List {...mockedProps} />);
  expect(container).toBeInTheDocument();
});

test('should render the correct number of items', () => {
  render(<List {...mockedProps} />);

  const listItemElements = screen.getAllByText(/Item \d/);

  expect(listItemElements.length).toBe(3);
  listItemElements.forEach((item, index) => {
    expect(item).toHaveTextContent(`Item ${index + 1}`);
  });
});
