from dataclasses import dataclass, field


@dataclass(frozen=True)
class Concept:
    id: str
    name: str
    order: int
    description: str
    ground_truth: str
    fallback_question: str


CONCEPTS: list[Concept] = [
    Concept(
        id="slope",
        name="Slope",
        order=0,
        description="The rate of change of a line: rise over run.",
        ground_truth=(
            "Slope measures how much a line's output (y) changes for a given "
            "change in input (x). It has no relation to the 'size' of anything, "
            "only the steepness/direction of change."
        ),
        fallback_question=(
            "If you walk along a line and x increases by 1, and y increases by 3, "
            "what is the slope, and what does that number actually describe?"
        ),
    ),
    Concept(
        id="derivative",
        name="Derivative",
        order=1,
        description="The instantaneous slope of a function at a point.",
        ground_truth=(
            "A derivative is the slope of a curve at a single point... the "
            "instantaneous rate of change of a function's output with respect "
            "to its input. It describes direction and steepness, not magnitude "
            "of the input itself."
        ),
        fallback_question=(
            "For a curve (not a straight line), why can't we just use one slope "
            "value for the whole curve the way we can for a line? What does the "
            "derivative give us instead?"
        ),
    ),
    Concept(
        id="gradient",
        name="Gradient",
        order=2,
        description="The multivariable generalization of the derivative... a vector of partial derivatives pointing in the direction of steepest ascent.",
        ground_truth=(
            "The gradient of a loss function with respect to the weights is a "
            "vector of partial derivatives. It points in the direction of "
            "steepest INCREASE of the loss, and its magnitude reflects how "
            "sensitive the loss is to each weight... not how large the weights "
            "themselves are, and not how big a step to take."
        ),
        fallback_question=(
            "The gradient is a vector. What does its DIRECTION tell us, and "
            "separately, what does its MAGNITUDE tell us? Are those the same thing "
            "as 'how much to change the weights'?"
        ),
    ),
    Concept(
        id="learning_rate",
        name="Learning Rate",
        order=3,
        description="A separate scalar hyperparameter that scales the gradient to determine the actual step size.",
        ground_truth=(
            "The learning rate is a hyperparameter, chosen independently of the "
            "gradient, that scales how big a step is actually taken. The gradient "
            "says WHICH direction increases loss; the learning rate says HOW FAR "
            "to move against that direction. Confusing the two is the single most "
            "common misconception in this chain."
        ),
        fallback_question=(
            "If the gradient tells us the direction of steepest increase, what "
            "specifically decides HOW FAR we move in the opposite direction on "
            "each update step?"
        ),
    ),
    Concept(
        id="gradient_descent",
        name="Gradient Descent",
        order=4,
        description="The iterative optimization algorithm: repeatedly step opposite the gradient, scaled by the learning rate, to minimize a loss function.",
        ground_truth=(
            "Gradient descent repeats: compute the gradient of the loss with "
            "respect to the weights, then update weights by subtracting the "
            "gradient scaled by the learning rate (w = w - lr * gradient). This "
            "moves weights in the direction that decreases loss, and it works "
            "iteratively, not in one shot."
        ),
        fallback_question=(
            "Write out, in words, the actual update rule: given a current weight, "
            "the gradient, and the learning rate, how do we compute the new weight?"
        ),
    ),
]

CONCEPTS_BY_ID: dict[str, Concept] = {c.id: c for c in CONCEPTS}
CONCEPT_ORDER: list[str] = [c.id for c in CONCEPTS]

WEAK_THRESHOLD = 60  


def prerequisite_of(concept_id: str) -> str | None:
    """Return the id of the concept immediately before this one in the chain."""
    c = CONCEPTS_BY_ID[concept_id]
    if c.order == 0:
        return None
    return CONCEPTS[c.order - 1].id


def dependents_of(concept_id: str) -> list[str]:
    """Return ids of all concepts that come AFTER this one (i.e. rely on it)."""
    c = CONCEPTS_BY_ID[concept_id]
    return [x.id for x in CONCEPTS if x.order > c.order]
