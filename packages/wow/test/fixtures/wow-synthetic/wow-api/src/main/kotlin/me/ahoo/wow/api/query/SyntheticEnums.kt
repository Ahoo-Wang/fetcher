/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Not Wow source. Wire values in each shape the checker has to compare, with a
// known difference from this package in every one, so each comparison has
// something to report.
package me.ahoo.wow.api.query

// Wow gains a value upstream: it must be named as missing here.
enum class AggregationFunction { SUM, AVG, MIN, MAX, STDDEV, VARIANCE, MEDIAN }

// Wow drops one: this package would still send it.
enum class SearchMode { TERMS }

// Wow brings back a value this package keeps only for older servers.
enum class Operator { RAW }

// An enum with nothing to mirror it here.
enum class SyntheticOnlyInWow { ONE, TWO }

// Discriminators spelled as literals on a sealed interface.
@JsonSubTypes(
    JsonSubTypes.Type(SyntheticDispatch.Alpha::class, name = "ALPHA"),
    JsonSubTypes.Type(SyntheticDispatch.Beta::class, name = "BETA"),
)
sealed interface SyntheticDispatch {
    data object Alpha : SyntheticDispatch
    data object Beta : SyntheticDispatch
}

// An entry that is not UPPER_SNAKE is as much a wire value as one that is.
enum class Direction { ASC, DESC, random }

// A discriminator holding a hyphen and lowercase letters, with a further
// annotation between it and its interface whose arguments hold brackets.
@JsonSubTypes(
    JsonSubTypes.Type(HavingExpression.Condition::class, name = "CONDITION"),
    JsonSubTypes.Type(HavingExpression.NotNull::class, name = "not-null"),
)
@Schema(oneOf = [HavingExpression.Condition::class], discriminatorProperty = "type")
sealed interface HavingExpression {
    data object Condition : HavingExpression
    data object NotNull : HavingExpression
}

// An annotated entry is as much an entry. QUARTER must still be read, or it
// would be reported as sent here and unknown to Wow; FORTNIGHT is new.
enum class AggregationDateUnit {
    YEAR,
    @Deprecated("use MONTH") QUARTER,
    MONTH, WEEK, DAY, HOUR, MINUTE, SECOND,
    @JsonProperty("fortnight") FORTNIGHT,
}

// A discriminator spelled as a constant, the way Wow spells its filter
// operators, and one whose constant cannot be found.
object SyntheticProtocol {
    object Group {
        const val NEW_TYPE = "new-type"
    }
}

@JsonSubTypes(
    JsonSubTypes.Type(AggregationGroup.New::class, name = SyntheticProtocol.Group.NEW_TYPE),
    JsonSubTypes.Type(AggregationGroup.Lost::class, name = Nowhere.MISSING),
)
sealed interface AggregationGroup {
    data object New : AggregationGroup
    data object Lost : AggregationGroup
}

// Something the parser recognises as an entry but cannot read. Not valid
// Kotlin; it stands for whatever shape the parser has not met yet, which must
// be reported rather than dropped.
enum class Unreadable { FINE, @ BROKEN }

