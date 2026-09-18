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
