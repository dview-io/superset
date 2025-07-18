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
import { sharedControlComponents } from '@superset-ui/chart-controls';
import { getExtensionsRegistry } from '@superset-ui/core';
import AnnotationLayerControl from './AnnotationLayerControl';
import BoundsControl from './BoundsControl';
import CheckboxControl from './CheckboxControl';
import CollectionControl from './CollectionControl';
import ColorPickerControl from './ColorPickerControl';
import ColorSchemeControl from './ColorSchemeControl';
import DatasourceControl from './DatasourceControl';
import DateFilterControl from './DateFilterControl';
import FixedOrMetricControl from './FixedOrMetricControl';
import HiddenControl from './HiddenControl';
import SelectAsyncControl from './SelectAsyncControl';
import SelectControl from './SelectControl';
import SliderControl from './SliderControl';
import SpatialControl from './SpatialControl';
import TextAreaControl from './TextAreaControl';
import TextControl from './TextControl';
import TimeSeriesColumnControl from './TimeSeriesColumnControl';
import TimeOffsetControl from './TimeOffsetControl';
import ViewportControl from './ViewportControl';
import VizTypeControl from './VizTypeControl';
import MetricsControl from './MetricControl/MetricsControl';
import AdhocFilterControl from './FilterControl/AdhocFilterControl';
import ConditionalFormattingControl from './ConditionalFormattingControl';
import ContourControl from './ContourControl';
import DndColumnSelectControl, {
  DndColumnSelect,
  DndFilterSelect,
  DndMetricSelect,
} from './DndColumnSelectControl';
import XAxisSortControl from './XAxisSortControl';
import CurrencyControl from './CurrencyControl';
import ColumnConfigControl from './ColumnConfigControl';
import { ComparisonRangeLabel } from './ComparisonRangeLabel';
import LayerConfigsControl from './LayerConfigsControl/LayerConfigsControl';
import MapViewControl from './MapViewControl/MapViewControl';
import ZoomConfigControl from './ZoomConfigControl/ZoomConfigControl';
import NumberControl from './NumberControl';

const extensionsRegistry = getExtensionsRegistry();
const DateFilterControlExtension = extensionsRegistry.get(
  'filter.dateFilterControl',
);
const DateFilterComponent = DateFilterControlExtension ?? DateFilterControl;

const controlMap = {
  AnnotationLayerControl,
  BoundsControl,
  CheckboxControl,
  CollectionControl,
  ColorPickerControl,
  ColorSchemeControl,
  ColumnConfigControl,
  CurrencyControl,
  DatasourceControl,
  DateFilterControl: DateFilterComponent,
  DndColumnSelectControl,
  DndColumnSelect,
  DndFilterSelect,
  DndMetricSelect,
  FixedOrMetricControl,
  HiddenControl,
  LayerConfigsControl,
  MapViewControl,
  SelectAsyncControl,
  SelectControl,
  SliderControl,
  SpatialControl,
  TextAreaControl,
  TextControl,
  TimeSeriesColumnControl,
  ViewportControl,
  VizTypeControl,
  MetricsControl,
  AdhocFilterControl,
  ConditionalFormattingControl,
  XAxisSortControl,
  ContourControl,
  ComparisonRangeLabel,
  TimeOffsetControl,
  ZoomConfigControl,
  NumberControl,
  ...sharedControlComponents,
};
export default controlMap;
